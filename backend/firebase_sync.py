"""
Firebase sync module for RemindAR.
Handles real-time sync with Firestore including embeddings.
"""

import os
# Fix gRPC DNS resolution issue - use native resolver instead of c-ares
# This MUST be set before importing any gRPC-dependent modules
os.environ.setdefault("GRPC_DNS_RESOLVER", "native")

import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
from typing import Optional, Callable, Dict, Any, List
import numpy as np

# Path to credentials
CRED_PATH = Path(__file__).parent / "firebase-credentials.json"

# Global state
_firebase_app: Optional[firebase_admin.App] = None
_db: Optional[firestore.Client] = None
_listeners: list[Callable[[str, Dict[str, Any]], None]] = []
_initialized = False


def init_firebase() -> bool:
    """Initialize Firebase Admin SDK."""
    global _firebase_app, _db, _initialized
    
    if _initialized:
        return True
    
    if not CRED_PATH.exists():
        print("[Firebase] Credentials file not found, running without sync")
        return False
    
    try:
        cred = credentials.Certificate(str(CRED_PATH))
        _firebase_app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _initialized = True
        print("[Firebase] Initialized successfully")
        return True
    except Exception as e:
        print(f"[Firebase] Initialization failed: {e}")
        return False


def is_initialized() -> bool:
    """Check if Firebase is initialized."""
    return _initialized


def get_db() -> Optional[firestore.Client]:
    """Get Firestore client."""
    return _db


def add_update_listener(callback: Callable[[str, Dict[str, Any]], None]):
    """Add a listener for database updates."""
    _listeners.append(callback)


def notify_update(event_type: str, data: Dict[str, Any]):
    """Notify all listeners of an update."""
    for listener in _listeners:
        try:
            listener(event_type, data)
        except Exception as e:
            print(f"[Firebase] Listener error: {e}")


def sync_person_to_firebase(person_data: Dict[str, Any], embedding: Optional[np.ndarray] = None, user_id: str = ''):
    """
    Sync a person record to Firebase Firestore.
    Stored under /users/{user_id}/people/{person_id}
    """
    if not _initialized or not _db or not user_id:
        return
    
    try:
        person_id = person_data.get("id")
        if not person_id:
            return
        
        # Create Firestore document
        doc_data = {
            "name": person_data.get("name", ""),
            "relation": person_data.get("relation", ""),
            "last_met": person_data.get("last_met", ""),
            "context": person_data.get("context", ""),
            "has_embedding": embedding is not None,
            "deleted": False,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        
        # Include face image for cross-device sync
        face_img = person_data.get("face_image")
        if face_img:
            doc_data["face_image"] = face_img
        
        # Store embedding as list of floats
        if embedding is not None:
            doc_data["embedding"] = embedding.tolist()
        
        # Write to Firestore under /users/{user_id}/people/{person_id}
        _db.collection("users").document(user_id).collection("people").document(person_id).set(doc_data, merge=True)
        print(f"[Firebase] Synced person: {person_id} for user {user_id[:8]}")
        
        # Notify listeners - use serializable data only (no Sentinel!)
        from datetime import datetime
        notify_data = {
            "id": person_id,
            "name": person_data.get("name", ""),
            "relation": person_data.get("relation", ""),
            "last_met": person_data.get("last_met", ""),
            "context": person_data.get("context", ""),
            "updated_at": datetime.now().isoformat(),
        }
        notify_update("person_updated", notify_data)
        
    except Exception as e:
        print(f"[Firebase] Sync error: {e}")


def sync_embedding_to_firebase(person_id: str, embedding: np.ndarray, user_id: str = ''):
    """Store face embedding in Firestore."""
    if not _initialized or not _db or not user_id:
        return
    
    try:
        _db.collection("users").document(user_id).collection("people").document(person_id).update({
            "embedding": embedding.tolist(),
            "has_embedding": True,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        print(f"[Firebase] Stored embedding for: {person_id}")
        
        notify_update("embedding_added", {
            "id": person_id,
            "has_embedding": True
        })
        
    except Exception as e:
        print(f"[Firebase] Embedding sync error: {e}")


def delete_person_from_firebase(person_id: str, user_id: str = ''):
    """Soft-delete a person in Firebase (mark as deleted, don't actually remove)."""
    if not _initialized or not _db or not user_id:
        return
    
    try:
        _db.collection("users").document(user_id).collection("people").document(person_id).update({
            "deleted": True,
            "deleted_at": firestore.SERVER_TIMESTAMP,
        })
        print(f"[Firebase] Soft-deleted person: {person_id} for user {user_id[:8]}")
        notify_update("person_deleted", {"id": person_id})
    except Exception as e:
        print(f"[Firebase] Delete error: {e}")


def get_all_people_from_firebase(timeout_seconds: float = 10.0) -> List[Dict[str, Any]]:
    """
    Fetch all people with embeddings from Firestore.
    Reads from /users/{uid}/people/ structure.
    Skips deleted entries.
    
    Args:
        timeout_seconds: Maximum time to wait for Firestore response.
    """
    if not _initialized or not _db:
        return []
    
    try:
        import threading
        
        result = []
        error = [None]
        completed = threading.Event()
        
        def fetch_docs():
            try:
                users_ref = _db.collection("users")
                user_docs = list(users_ref.stream())
                
                if not user_docs:
                    print("[Firebase] No users found in Firestore")
                    return
                
                for user_doc in user_docs:
                    user_id = user_doc.id
                    people_ref = users_ref.document(user_id).collection("people")
                    
                    for doc in people_ref.stream():
                        data = doc.to_dict()
                        if not data:
                            continue
                        
                        # Skip deleted entries
                        if data.get("deleted"):
                            continue
                        
                        data["id"] = doc.id
                        data["user_id"] = user_id
                        
                        # Only include people with embeddings
                        if not data.get("has_embedding"):
                            continue
                        
                        # Convert embedding list back to numpy array
                        if "embedding" in data and data["embedding"]:
                            data["embedding_array"] = np.array(data["embedding"], dtype=np.float32)
                        else:
                            data["embedding_array"] = None
                        
                        result.append(data)
                    
            except Exception as e:
                error[0] = e
            finally:
                completed.set()
        
        # Start fetch in daemon thread
        thread = threading.Thread(target=fetch_docs, daemon=True)
        thread.start()
        
        # Wait for completion or timeout
        if completed.wait(timeout=timeout_seconds):
            if error[0]:
                print(f"[Firebase] Fetch error: {error[0]}")
                return []
            print(f"[Firebase] Loaded {len(result)} people with embeddings from all users")
            return result
        else:
            print(f"[Firebase] Fetch timed out after {timeout_seconds}s - continuing without Firestore sync")
            return []
        
    except Exception as e:
        print(f"[Firebase] Fetch error: {e}")
        return []


# ============================================
# History Sync Functions
# ============================================

def sync_history_to_firebase(
    person_id: str,
    user_id: str,
    entry_id: str,
    field_changed: str,
    old_value: str,
    new_value: str
):
    """
    Sync a history entry to Firebase Firestore.
    Stored under /users/{user_id}/people/{person_id}/history/{entry_id}
    """
    if not _initialized or not _db or not user_id:
        return
    
    try:
        doc_data = {
            "field_changed": field_changed,
            "old_value": old_value,
            "new_value": new_value,
            "changed_at": firestore.SERVER_TIMESTAMP,
        }
        
        _db.collection("users").document(user_id).collection("people").document(person_id).collection("history").document(entry_id).set(doc_data)
        print(f"[Firebase] Synced history entry {entry_id} for person {person_id}")
        
    except Exception as e:
        print(f"[Firebase] History sync error: {e}")


def get_person_history_from_firebase(person_id: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Fetch all history entries for a person from Firestore.
    Returns list of history entries ordered by changed_at descending.
    """
    if not _initialized or not _db or not user_id:
        return []
    
    try:
        history_ref = _db.collection("users").document(user_id).collection("people").document(person_id).collection("history")
        docs = history_ref.order_by("changed_at", direction=firestore.Query.DESCENDING).stream()
        
        result = []
        for doc in docs:
            data = doc.to_dict()
            if data:
                data["id"] = doc.id
                data["person_id"] = person_id
                data["user_id"] = user_id
                # Convert Firestore timestamp to ISO string
                if data.get("changed_at"):
                    data["changed_at"] = data["changed_at"].isoformat() if hasattr(data["changed_at"], 'isoformat') else str(data["changed_at"])
                result.append(data)
        
        return result
        
    except Exception as e:
        print(f"[Firebase] History fetch error: {e}")
        return []
