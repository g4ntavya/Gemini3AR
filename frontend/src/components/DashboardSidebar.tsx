/**
 * Dashboard Sidebar - Shows all registered people with swipe actions
 * Also displays pending people queue (unknown faces saved for later)
 */

import { useState, useEffect, useCallback } from 'react';
import { Person } from '../types';
import { PendingPerson } from './PendingPersonNotification';
import { API, authFetch } from '../config/api';
import { SwipeableCard } from './SwipeableCard';
import { PersonDetailModal } from './PersonDetailModal';

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pendingQueue?: PendingPerson[];
    onAddPendingPerson?: (person: PendingPerson) => void;
    onRemovePendingPerson?: (trackId: string) => void;
}

export function DashboardSidebar({ isOpen, onClose, pendingQueue = [], onAddPendingPerson, onRemovePendingPerson }: DashboardSidebarProps) {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    // Fetch people when sidebar opens
    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
            fetchPeople();
        }
    }, [isOpen]);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const res = await authFetch(API.people);
            if (res.ok) {
                const data = await res.json();
                setPeople(data);
            }
        } catch (error) {
            console.error('[Dashboard] Failed to fetch people:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 280); // Slightly less than animation duration
    }, [onClose]);

    // Filter people by search query - reverse to show newest first
    // (backend returns in chronological order, we reverse for reverse-chronological)
    const filteredPeople = [...people]
        .reverse()
        .filter(person => {
            const query = searchQuery.toLowerCase();
            return (
                person.name?.toLowerCase().includes(query) ||
                person.relation?.toLowerCase().includes(query) ||
                person.context?.toLowerCase().includes(query)
            );
        });

    // TTS for person info
    const speakPerson = useCallback((person: Person) => {
        const text = `${person.name}. ${person.relation || ''}. ${person.context || ''}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    // Open person detail modal
    const handlePersonClick = useCallback((person: Person) => {
        setSelectedPerson(person);
    }, []);

    // Close person detail modal
    const handleDetailClose = useCallback(() => {
        setSelectedPerson(null);
    }, []);

    // Edit person
    const handleEdit = useCallback(async (person: Person) => {
        const newName = prompt('Edit name:', person.name);
        if (newName === null) return;

        const newRelation = prompt('Edit relation:', person.relation || '');
        const newContext = prompt('Edit context:', person.context || '');

        try {
            const res = await authFetch(`${API.people}/${person.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName || person.name,
                    relation: newRelation || person.relation,
                    context: newContext || person.context,
                    last_met: person.last_met
                })
            });
            if (res.ok) {
                // Update local state immediately
                setPeople(prev => prev.map(p =>
                    p.id === person.id
                        ? { ...p, name: newName || p.name, relation: newRelation || p.relation, context: newContext || p.context }
                        : p
                ));
            }
        } catch (err) {
            console.error('[Dashboard] Edit failed:', err);
        }
    }, []);

    // Delete person
    const handleDelete = useCallback((person: Person) => {
        if (!confirm(`Delete ${person.name}? This cannot be undone.`)) return;

        authFetch(`${API.people}/${person.id}`, {
            method: 'DELETE'
        }).then(res => {
            if (res.ok) {
                setPeople(prev => prev.filter(p => p.id !== person.id));
            }
        }).catch(err => console.error('[Dashboard] Delete failed:', err));
    }, []);

    // Format remaining time for pending person expiry
    const formatTimeRemaining = useCallback((expiresAt: number): string => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) return 'Expired';
        
        const minutes = Math.floor(remaining / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            const remainingMins = minutes % 60;
            return `${hours}h ${remainingMins}m left`;
        }
        return `${minutes}m left`;
    }, []);

    if (!isOpen && !isClosing) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sidebar-backdrop ${isClosing ? 'closing' : ''}`}
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className={`dashboard-sidebar open ${isClosing ? 'closing' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <h2>People</h2>
                    <button className="close-btn" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="sidebar-search">
                    <input
                        type="text"
                        placeholder="Search people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Pending People Queue */}
                {pendingQueue.length > 0 && (
                    <div className="pending-queue-section">
                        <div className="pending-queue-header">
                            <span className="pending-queue-title">Saved for Later</span>
                            <span className="pending-queue-count">{pendingQueue.length}</span>
                        </div>
                        <div className="pending-queue-list">
                            {pendingQueue.map((person) => (
                                <div key={person.trackId} className="pending-queue-item">
                                    <div className="pending-queue-avatar">
                                        <img src={person.faceImage} alt="Unknown face" />
                                    </div>
                                    <div className="pending-queue-info">
                                        <span className="pending-queue-label">Unknown Person</span>
                                        <span className="pending-queue-expiry">{formatTimeRemaining(person.expiresAt)}</span>
                                    </div>
                                    <div className="pending-queue-actions">
                                        <button 
                                            className="pending-add-btn"
                                            onClick={() => onAddPendingPerson?.(person)}
                                            title="Add this person"
                                        >
                                            Add
                                        </button>
                                        <button 
                                            className="pending-dismiss-btn"
                                            onClick={() => onRemovePendingPerson?.(person.trackId)}
                                            title="Dismiss"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* People List */}
                <div className="sidebar-content">
                    {loading ? (
                        <div className="sidebar-loading">Loading...</div>
                    ) : filteredPeople.length === 0 ? (
                        <div className="sidebar-empty">
                            {searchQuery ? 'No matches found' : 'No people registered yet'}
                        </div>
                    ) : (
                        <div className="people-list">
                            {filteredPeople.map((person) => (
                                <SwipeableCard
                                    key={person.id}
                                    person={person}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onSpeak={speakPerson}
                                    onClick={handlePersonClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with count */}
                <div className="sidebar-footer">
                    {people.length} {people.length === 1 ? 'person' : 'people'} registered
                </div>
            </div>

            {/* Person Detail Modal */}
            <PersonDetailModal
                person={selectedPerson}
                isOpen={selectedPerson !== null}
                onClose={handleDetailClose}
            />
        </>
    );
}
