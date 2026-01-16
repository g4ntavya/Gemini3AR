/**
 * Dashboard Sidebar - Shows all registered people with swipe actions
 */

import { useState, useEffect, useCallback } from 'react';
import { Person } from '../types';
import { API } from '../config/api';
import { SwipeableCard } from './SwipeableCard';

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
            const res = await fetch(API.people);
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
    const speakPerson = useCallback((person: Person) => {
        const text = `${person.name}. ${person.relation || ''}. ${person.context || ''}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    // Edit person
    const handleEdit = useCallback((person: Person) => {
        // For now, prompt for new info (you can replace with a modal later)
        const newName = prompt('Edit name:', person.name);
        if (newName === null) return;

        const newRelation = prompt('Edit relation:', person.relation || '');
        const newContext = prompt('Edit context:', person.context || '');

        // Update via API
        fetch(`${API.people}/${person.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName || person.name,
                relation: newRelation || person.relation,
                context: newContext || person.context,
                last_met: person.last_met
            })
        }).then(res => {
            if (res.ok) {
                fetchPeople(); // Refresh the list
            }
        }).catch(err => console.error('[Dashboard] Edit failed:', err));
    }, []);

    // Delete person
    const handleDelete = useCallback((person: Person) => {
        if (!confirm(`Delete ${person.name}? This cannot be undone.`)) return;

        fetch(`${API.people}/${person.id}`, {
            method: 'DELETE'
        }).then(res => {
            if (res.ok) {
                setPeople(prev => prev.filter(p => p.id !== person.id));
            }
        }).catch(err => console.error('[Dashboard] Delete failed:', err));
    }, []);

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
                                <SwipeableCard
                                    key={person.id}
                                    person={person}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onSpeak={speakPerson}
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
        </>
    );
}
