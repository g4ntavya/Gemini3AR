/**
 * Dashboard Sidebar - Shows all registered people
 */

import { useState, useEffect } from 'react';
import { Person } from '../types';

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch people when sidebar opens
    useEffect(() => {
        if (isOpen) {
            fetchPeople();
        }
    }, [isOpen]);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/people');
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

    // Filter people by search query
    const filteredPeople = people.filter(person => {
        const query = searchQuery.toLowerCase();
        return (
            person.name?.toLowerCase().includes(query) ||
            person.relation?.toLowerCase().includes(query) ||
            person.context?.toLowerCase().includes(query)
        );
    });

    // TTS for person info
    const speakPerson = (person: Person) => {
        const text = `${person.name}. ${person.relation || ''}. ${person.context || ''}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="sidebar-backdrop" onClick={onClose} />

            {/* Sidebar */}
            <div className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <h2>People</h2>
                    <button className="close-btn" onClick={onClose}>
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
                                <div key={person.id} className="person-card">
                                    <div className="person-info">
                                        <div className="person-name">{person.name}</div>
                                        {person.relation && (
                                            <div className="person-relation">{person.relation}</div>
                                        )}
                                        {person.context && (
                                            <div className="person-context">{person.context}</div>
                                        )}
                                        {person.last_met && (
                                            <div className="person-lastmet">
                                                Last met: {new Date(person.last_met).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    {/* TTS Button */}
                                    <button
                                        className="action-btn speak-btn"
                                        onClick={() => speakPerson(person)}
                                        title="Read aloud"
                                    >
                                        🔊
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with count */}
                <div className="sidebar-footer">
                    {people.length} {people.length === 1 ? 'person' : 'people'} registered
                </div>
            </div>
        </>
    );
}
