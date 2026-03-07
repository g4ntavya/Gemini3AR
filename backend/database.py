"""
SQLite database module for RemindAR.
Handles storage and retrieval of known people and their embeddings.
"""

import sqlite3
import json
import numpy as np
from typing import Optional, List, Tuple
from pathlib import Path
import threading

# Thread-local storage for database connections
_local = threading.local()

# Database file path
DB_PATH = Path(__file__).parent / "remindar.db"


def get_connection() -> sqlite3.Connection:
    """Get a thread-local database connection."""
    if not hasattr(_local, "connection"):
        _local.connection = sqlite3.connect(str(DB_PATH))
        _local.connection.row_factory = sqlite3.Row
    return _local.connection


def init_database():
    """
    Initialize the database schema.
    Creates the people table if it doesn't exist.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Main table for known people
    # Embeddings stored as JSON-serialized arrays for simplicity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS people (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT '',
            name TEXT NOT NULL,
            relation TEXT NOT NULL,
            last_met TEXT NOT NULL,
            context TEXT NOT NULL,
            embedding TEXT,
            face_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migration: Add columns if they don't exist (for existing databases)
    cursor.execute("PRAGMA table_info(people)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'face_image' not in columns:
        cursor.execute("ALTER TABLE people ADD COLUMN face_image TEXT")
        print("[DB] Added face_image column to existing table")
    if 'user_id' not in columns:
        cursor.execute("ALTER TABLE people ADD COLUMN user_id TEXT NOT NULL DEFAULT ''")
        print("[DB] Added user_id column to existing table")
    
    # Index for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_people_name ON people(name)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id)
    """)
    
    conn.commit()
    print(f"[DB] Database initialized at {DB_PATH}")


def add_person(
    person_id: str,
    name: str,
    relation: str,
    last_met: str,
    context: str,
    user_id: str = '',
    embedding: Optional[np.ndarray] = None,
    face_image: Optional[str] = None
) -> bool:
    """
    Add a new person to the database.
    Returns True if successful, False if ID already exists.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Serialize embedding to JSON if provided
    embedding_json = None
    if embedding is not None:
        embedding_json = json.dumps(embedding.tolist())
    
    try:
        cursor.execute("""
            INSERT INTO people (id, user_id, name, relation, last_met, context, embedding, face_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (person_id, user_id, name, relation, last_met, context, embedding_json, face_image))
        conn.commit()
        print(f"[DB] Added person: {name} ({person_id}) for user {user_id[:8]}")
        return True
    except sqlite3.IntegrityError:
        print(f"[DB] Person already exists: {person_id}")
        return False


def update_person(
    person_id: str,
    name: str,
    relation: str,
    last_met: str,
    context: str
) -> bool:
    """Update an existing person's details (not embedding)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE people 
        SET name = ?, relation = ?, last_met = ?, context = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (name, relation, last_met, context, person_id))
    conn.commit()
    
    if cursor.rowcount > 0:
        print(f"[DB] Updated person: {name} ({person_id})")
        return True
    return False


def update_embedding(person_id: str, embedding: np.ndarray) -> bool:
    """Update the face embedding for a person."""
    conn = get_connection()
    cursor = conn.cursor()
    
    embedding_json = json.dumps(embedding.tolist())
    
    cursor.execute("""
        UPDATE people 
        SET embedding = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (embedding_json, person_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    
    if success:
        print(f"[DB] Updated embedding for: {person_id}")
    return success


def update_face_image(person_id: str, face_image: str) -> bool:
    """Update the face image for a person (base64 encoded)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE people 
        SET face_image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (face_image, person_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    
    if success:
        print(f"[DB] Updated face_image for: {person_id}")
    return success


def get_person(person_id: str) -> Optional[dict]:
    """Get a person by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM people WHERE id = ?", (person_id,))
    row = cursor.fetchone()
    
    if row:
        return dict(row)
    return None


def get_all_people_with_embeddings(user_id: str = '') -> List[Tuple[dict, Optional[np.ndarray]]]:
    """
    Get all people who have embeddings for a specific user.
    Returns list of (person_dict, embedding_array) tuples.
    Used for face matching.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM people WHERE embedding IS NOT NULL AND user_id = ?", (user_id,))
    rows = cursor.fetchall()
    
    results = []
    for row in rows:
        person = dict(row)
        embedding = None
        if person.get("embedding"):
            embedding = np.array(json.loads(person["embedding"]))
        # Remove embedding from person dict (not needed in response)
        person.pop("embedding", None)
        results.append((person, embedding))
    
    return results


def get_all_people(user_id: str = '') -> List[dict]:
    """Get all people (without embeddings) for a specific user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, relation, last_met, context, face_image FROM people WHERE user_id = ?", (user_id,))
    return [dict(row) for row in cursor.fetchall()]


def get_all_people_lightweight(user_id: str = '') -> List[dict]:
    """Get all people without face_image or embedding (for prompt context)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, relation, last_met, context FROM people WHERE user_id = ?", (user_id,))
    return [dict(row) for row in cursor.fetchall()]


def delete_person(person_id: str) -> bool:
    """Delete a person by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM people WHERE id = ?", (person_id,))
    success = cursor.rowcount > 0
    conn.commit()
    
    if success:
        print(f"[DB] Deleted person: {person_id}")
    return success


def seed_demo_data():
    """
    Seed the database with demo identities.
    These will need their embeddings updated with real photos.
    """
    demo_people = [
        {
            "id": "demo_001",
            "name": "Sarah",
            "relation": "Daughter",
            "last_met": "Yesterday",
            "context": "Had dinner together, talked about her new job"
        },
        {
            "id": "demo_002", 
            "name": "Dr. Patel",
            "relation": "Doctor",
            "last_met": "Last week",
            "context": "Regular checkup, discussed medication"
        },
        {
            "id": "demo_003",
            "name": "Mike",
            "relation": "Neighbor",
            "last_met": "This morning",
            "context": "Waved hello, mentioned the weather"
        },
        {
            "id": "demo_004",
            "name": "Emma",
            "relation": "Granddaughter",
            "last_met": "Sunday",
            "context": "Video call, showed her art project"
        }
    ]
    
    for person in demo_people:
        add_person(
            person_id=person["id"],
            name=person["name"],
            relation=person["relation"],
            last_met=person["last_met"],
            context=person["context"]
        )
    
    print(f"[DB] Seeded {len(demo_people)} demo identities")


def clear_all_people():
    """Clear all people from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM people")
    conn.commit()
    print("[DB] Cleared all people from database")


def sync_from_firestore(firestore_people: list):
    """
    Sync people from Firestore to SQLite.
    Uses a single transaction so crash mid-sync won't lose data.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN IMMEDIATE")
        
        # Clear existing data
        cursor.execute("DELETE FROM people")
        
        synced = 0
        for person in firestore_people:
            person_id = person.get("id")
            if not person_id:
                continue
                
            # Get embedding if available
            embedding_json = None
            if "embedding" in person and person["embedding"]:
                embedding_json = json.dumps(person["embedding"])
            
            cursor.execute("""
                INSERT OR REPLACE INTO people (id, user_id, name, relation, last_met, context, embedding, face_image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                person_id,
                person.get("user_id", ""),
                person.get("name", ""),
                person.get("relation", ""),
                person.get("last_met", ""),
                person.get("context", ""),
                embedding_json,
                person.get("face_image", None)
            ))
            synced += 1
        
        conn.commit()
        print(f"[DB] Synced {synced} people from Firestore to SQLite")
        return synced
    except Exception as e:
        conn.rollback()
        print(f"[DB] Firestore sync failed, rolled back: {e}")
        raise


# Initialize on import
init_database()

