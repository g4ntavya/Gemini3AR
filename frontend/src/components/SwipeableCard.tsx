/**
 * Swipeable Person Card - iOS style swipe with spring animation
 * Real-time tracking for touch, mouse drag, and trackpad
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Person } from '../types';

interface SwipeableCardProps {
    person: Person;
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
    onSpeak: (person: Person) => void;
}

const ACTION_WIDTH = 152; // width of action buttons area (70+70+12 gap)
const SNAP_THRESHOLD = 0.2; // 20% of ACTION_WIDTH to snap open

export function SwipeableCard({ person, onEdit, onDelete, onSpeak }: SwipeableCardProps) {
    const [offsetX, setOffsetX] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startOffsetRef = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Snap to open or closed with spring effect
    const snapToPosition = useCallback(() => {
        const threshold = ACTION_WIDTH * SNAP_THRESHOLD;
        if (offsetX >= threshold) {
            setOffsetX(ACTION_WIDTH);
            setIsOpen(true);
        } else {
            setOffsetX(0);
            setIsOpen(false);
        }
        setIsDragging(false);
    }, [offsetX]);

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX;
        startOffsetRef.current = offsetX;
    }, [offsetX]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const diff = startXRef.current - e.touches[0].clientX;
        let newOffset = startOffsetRef.current + diff;
        // Allow slight overshoot for spring feel
        newOffset = Math.max(-20, Math.min(ACTION_WIDTH + 20, newOffset));
        setOffsetX(newOffset);
    }, []);

    const handleTouchEnd = useCallback(() => {
        snapToPosition();
    }, [snapToPosition]);

    // Mouse drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        startXRef.current = e.clientX;
        startOffsetRef.current = offsetX;
        e.preventDefault();
    }, [offsetX]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const diff = startXRef.current - e.clientX;
            let newOffset = startOffsetRef.current + diff;
            newOffset = Math.max(-20, Math.min(ACTION_WIDTH + 20, newOffset));
            setOffsetX(newOffset);
        };

        const handleMouseUp = () => {
            if (isDragging) snapToPosition();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, snapToPosition]);

    // Wheel/trackpad
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.3) {
                e.preventDefault();
                setIsDragging(true);

                setOffsetX(prev => {
                    const newOffset = prev + e.deltaX;
                    return Math.max(-20, Math.min(ACTION_WIDTH + 20, newOffset));
                });

                if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = setTimeout(() => snapToPosition(), 80);
            }
        };

        card.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            card.removeEventListener('wheel', handleWheel);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        };
    }, [snapToPosition]);

    const closeActions = useCallback(() => {
        setOffsetX(0);
        setIsOpen(false);
        setIsDragging(false);
    }, []);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        closeActions();
        onEdit(person);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        closeActions();
        onDelete(person);
    };

    // Clamp offset for visual rendering (don't show overshoot visually)
    const visualOffset = Math.max(0, Math.min(ACTION_WIDTH, offsetX));

    return (
        <div className="swipeable-card-container">
            {/* Action buttons - separate from card with gap */}
            <div
                className="swipe-actions"
                style={{
                    opacity: Math.min(1, visualOffset / (ACTION_WIDTH * 0.5)),
                    transform: `translateX(${Math.max(0, ACTION_WIDTH - visualOffset)}px)`,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease'
                }}
            >
                <button className="swipe-action-btn edit-btn" onClick={handleEdit}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button className="swipe-action-btn delete-btn" onClick={handleDelete}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>

            {/* Main card with spring animation */}
            <div
                ref={cardRef}
                className={`person-card ${isOpen ? 'swiped' : ''}`}
                style={{
                    transform: `translateX(-${visualOffset}px)`,
                    // Spring animation: cubic-bezier with overshoot
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClick={isOpen ? closeActions : undefined}
            >
                <div className="person-info">
                    <div className="person-name">{person.name}</div>
                    {person.relation && <div className="person-relation">{person.relation}</div>}
                    {person.context && <div className="person-context">{person.context}</div>}
                    {person.last_met && (
                        <div className="person-lastmet">
                            Last met: {new Date(person.last_met).toLocaleDateString()}
                        </div>
                    )}
                </div>
                <button
                    className="action-btn speak-btn"
                    onClick={(e) => { e.stopPropagation(); onSpeak(person); }}
                    title="Read aloud"
                >
                    🔊
                </button>
            </div>
        </div>
    );
}
