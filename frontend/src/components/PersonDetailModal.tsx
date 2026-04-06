/**
 * Person Detail Modal - Shows full profile with history
 */

import { useState, useEffect } from 'react';
import { Person, PersonHistoryEntry } from '../types';
import { API, authFetch } from '../config/api';
import { ContextHistory } from './ContextHistory';

interface PersonDetailModalProps {
    person: Person | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PersonDetailModal({ person, isOpen, onClose }: PersonDetailModalProps) {
    const [history, setHistory] = useState<PersonHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch history when modal opens
    useEffect(() => {
        if (isOpen && person) {
            setIsLoading(true);
            authFetch(API.personHistory(person.id))
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch history');
                })
                .then(data => {
                    setHistory(data || []);
                })
                .catch(err => {
                    console.error('[PersonDetail] Error fetching history:', err);
                    setHistory([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setHistory([]);
        }
    }, [isOpen, person]);

    if (!isOpen || !person) return null;

    return (
        <div className="person-detail-overlay" onClick={onClose}>
            <div className="person-detail-card" onClick={e => e.stopPropagation()}>
                {/* Header with avatar and basic info */}
                <div className="person-detail-header">
                    <div className="person-detail-avatar">
                        {person.face_image ? (
                            <img src={person.face_image} alt={person.name} />
                        ) : (
                            <span className="person-detail-avatar-placeholder">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                </svg>
                            </span>
                        )}
                    </div>
                    <div className="person-detail-info">
                        <h2 className="person-detail-name">{person.name}</h2>
                        <p className="person-detail-relation">{person.relation}</p>
                    </div>
                    <button className="person-detail-close" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Current context */}
                <div className="person-detail-context">
                    <div className="person-detail-context-label">Current Context</div>
                    {person.context ? (
                        <div className="person-detail-context-text">{person.context}</div>
                    ) : (
                        <div className="person-detail-context-text person-detail-context-empty">
                            No context added yet
                        </div>
                    )}
                </div>

                {/* History section */}
                <div className="history-section">
                    <div className="history-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                        </svg>
                        Change History
                    </div>
                    <ContextHistory
                        history={history}
                        currentContext={person.context || ''}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
