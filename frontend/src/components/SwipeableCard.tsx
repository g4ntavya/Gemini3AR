/**
 * Swipeable Person Card - iOS style swipe to reveal actions
 * Supports both touch (mobile) and trackpad/mouse wheel (desktop)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Person } from '../types';

interface SwipeableCardProps {
    person: Person;
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
    onSpeak: (person: Person) => void;
}

const SWIPE_THRESHOLD = 50; // px to trigger action reveal
const ACTION_WIDTH = 140; // width of action buttons area

export function SwipeableCard({ person, onEdit, onDelete, onSpeak }: SwipeableCardProps) {
    const [offsetX, setOffsetX] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const isDraggingRef = useRef(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const wheelAccumulatorRef = useRef(0);
    const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Snap to open or closed position
    const snapToPosition = useCallback((currentOffset: number) => {
        if (currentOffset > SWIPE_THRESHOLD) {
            setOffsetX(ACTION_WIDTH);
            setIsOpen(true);
        } else {
            setOffsetX(0);
            setIsOpen(false);
        }
    }, []);

    // Touch handlers (mobile)
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = isOpen ? ACTION_WIDTH : 0;
        isDraggingRef.current = true;
    }, [isOpen]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDraggingRef.current) return;

        const diff = startXRef.current - e.touches[0].clientX;
        let newOffset = currentXRef.current + diff;
        newOffset = Math.max(0, Math.min(ACTION_WIDTH, newOffset));
        setOffsetX(newOffset);
    }, []);

    const handleTouchEnd = useCallback(() => {
        isDraggingRef.current = false;
        snapToPosition(offsetX);
    }, [offsetX, snapToPosition]);

    // Mouse drag handlers (desktop)
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Don't start drag on button clicks
        if ((e.target as HTMLElement).closest('button')) return;

        startXRef.current = e.clientX;
        currentXRef.current = isOpen ? ACTION_WIDTH : 0;
        isDraggingRef.current = true;
        e.preventDefault();
    }, [isOpen]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const diff = startXRef.current - e.clientX;
        let newOffset = currentXRef.current + diff;
        newOffset = Math.max(0, Math.min(ACTION_WIDTH, newOffset));
        setOffsetX(newOffset);
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        snapToPosition(offsetX);
    }, [offsetX, snapToPosition]);

    // Wheel/trackpad handler - accumulate horizontal scroll then snap
    const handleWheel = useCallback((e: WheelEvent) => {
        // Only respond to horizontal scroll
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
            e.preventDefault();

            // Accumulate wheel delta
            wheelAccumulatorRef.current += e.deltaX;

            // Clear previous timeout
            if (wheelTimeoutRef.current) {
                clearTimeout(wheelTimeoutRef.current);
            }

            // Set timeout to snap after gesture ends
            wheelTimeoutRef.current = setTimeout(() => {
                // Check if accumulated scroll crossed threshold
                if (wheelAccumulatorRef.current > SWIPE_THRESHOLD && !isOpen) {
                    setOffsetX(ACTION_WIDTH);
                    setIsOpen(true);
                } else if (wheelAccumulatorRef.current < -SWIPE_THRESHOLD && isOpen) {
                    setOffsetX(0);
                    setIsOpen(false);
                }
                wheelAccumulatorRef.current = 0;
            }, 100);
        }
    }, [isOpen]);

    // Add/remove event listeners
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        card.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            card.removeEventListener('wheel', handleWheel);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (wheelTimeoutRef.current) {
                clearTimeout(wheelTimeoutRef.current);
            }
        };
    }, [handleWheel, handleMouseMove, handleMouseUp]);

    const closeActions = useCallback(() => {
        setOffsetX(0);
        setIsOpen(false);
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

    // Calculate if we're in transition (dragging) or snapped
    const isSnapped = offsetX === 0 || offsetX === ACTION_WIDTH;

    return (
        <div className="swipeable-card-container">
            {/* Action buttons (slide in from right) */}
            <div
                className="swipe-actions"
                style={{
                    transform: `translateX(${ACTION_WIDTH - offsetX}px)`,
                    transition: isSnapped ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
                }}
            >
                <button
                    className="swipe-action-btn edit-btn"
                    onClick={handleEdit}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button
                    className="swipe-action-btn delete-btn"
                    onClick={handleDelete}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>

            {/* Main card (swipeable) */}
            <div
                ref={cardRef}
                className={`person-card ${isOpen ? 'swiped' : ''}`}
                style={{
                    transform: `translateX(-${offsetX}px)`,
                    transition: isSnapped ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClick={isOpen ? closeActions : undefined}
            >
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
                    onClick={(e) => { e.stopPropagation(); onSpeak(person); }}
                    title="Read aloud"
                >
                    🔊
                </button>
            </div>
        </div>
    );
}
