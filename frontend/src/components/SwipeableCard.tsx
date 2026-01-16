/**
 * Swipeable Person Card - iOS style swipe with pure CSS animations
 * 
 * Features:
 * - Real-time tracking for touch, mouse, and trackpad
 * - Smooth CSS transitions for snap animations
 * - Icons scale up smoothly
 * - Consistent 8px gaps everywhere
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Person } from '../types';

interface SwipeableCardProps {
    person: Person;
    onEdit: (person: Person) => void;
    onDelete: (person: Person) => void;
    onSpeak: (person: Person) => void;
}

// Layout: [Card] 8px [Edit 60px] 8px [Delete 60px] = 136px total
const ACTION_WIDTH = 136;
const SNAP_THRESHOLD = 0.25;

export function SwipeableCard({ person, onEdit, onDelete, onSpeak }: SwipeableCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const isDraggingRef = useRef(false);
    const offsetRef = useRef(0);
    const startXRef = useRef(0);
    const startOffsetRef = useRef(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const editBtnRef = useRef<HTMLButtonElement>(null);
    const deleteBtnRef = useRef<HTMLButtonElement>(null);

    // Update visuals during drag - direct DOM, no transitions
    const updateVisuals = useCallback((offset: number, animate = false) => {
        const card = cardRef.current;
        const editBtn = editBtnRef.current;
        const deleteBtn = deleteBtnRef.current;

        if (!card || !editBtn || !deleteBtn) return;

        const clamped = Math.max(0, Math.min(ACTION_WIDTH, offset));
        offsetRef.current = clamped;

        const progress = clamped / ACTION_WIDTH;
        const scale = 0.5 + (progress * 0.5);

        // Toggle transition for animation
        if (animate) {
            card.style.transition = 'transform 0.25s ease-out';
            editBtn.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
            deleteBtn.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
        } else {
            card.style.transition = 'none';
            editBtn.style.transition = 'none';
            deleteBtn.style.transition = 'none';
        }

        card.style.transform = `translateX(${-clamped}px)`;
        editBtn.style.transform = `scale(${scale})`;
        editBtn.style.opacity = `${progress}`;
        deleteBtn.style.transform = `scale(${scale})`;
        deleteBtn.style.opacity = `${progress}`;
    }, []);

    // Snap to open or closed
    const snapToPosition = useCallback(() => {
        isDraggingRef.current = false;
        const shouldOpen = offsetRef.current >= ACTION_WIDTH * SNAP_THRESHOLD;
        const targetOffset = shouldOpen ? ACTION_WIDTH : 0;

        setIsAnimating(true);
        updateVisuals(targetOffset, true);
        setIsOpen(shouldOpen);

        // Clear animating state after transition
        setTimeout(() => setIsAnimating(false), 250);
    }, [updateVisuals]);

    // Start drag
    const startDrag = useCallback((clientX: number) => {
        if (isAnimating) return;
        isDraggingRef.current = true;
        startXRef.current = clientX;
        startOffsetRef.current = offsetRef.current;
    }, [isAnimating]);

    // Update drag
    const updateDrag = useCallback((clientX: number) => {
        if (!isDraggingRef.current) return;
        const diff = startXRef.current - clientX;
        updateVisuals(startOffsetRef.current + diff, false);
    }, [updateVisuals]);

    // End drag
    const endDrag = useCallback(() => {
        if (!isDraggingRef.current) return;
        snapToPosition();
    }, [snapToPosition]);

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startDrag(e.touches[0].clientX);
    }, [startDrag]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        updateDrag(e.touches[0].clientX);
    }, [updateDrag]);

    const handleTouchEnd = useCallback(() => endDrag(), [endDrag]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        startDrag(e.clientX);
        e.preventDefault();
    }, [startDrag]);

    // Global mouse events
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => updateDrag(e.clientX);
        const handleMouseUp = () => endDrag();

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [updateDrag, endDrag]);

    // Wheel/trackpad
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let wheelTimeout: ReturnType<typeof setTimeout> | null = null;

        const handleWheel = (e: WheelEvent) => {
            if (isAnimating) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
                e.preventDefault();

                const newOffset = offsetRef.current + (e.deltaX * 0.7);
                updateVisuals(newOffset, false);

                if (wheelTimeout) clearTimeout(wheelTimeout);
                wheelTimeout = setTimeout(() => {
                    snapToPosition();
                    wheelTimeout = null;
                }, 80);
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
            if (wheelTimeout) clearTimeout(wheelTimeout);
        };
    }, [isAnimating, updateVisuals, snapToPosition]);

    // Close actions
    const closeActions = useCallback(() => {
        setIsAnimating(true);
        updateVisuals(0, true);
        setIsOpen(false);
        setTimeout(() => setIsAnimating(false), 250);
    }, [updateVisuals]);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const p = person;
        closeActions();
        setTimeout(() => onEdit(p), 300);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        const p = person;
        closeActions();
        setTimeout(() => onDelete(p), 300);
    };

    return (
        <div ref={containerRef} className="swipeable-card-container">
            {/* Action buttons - fixed position, card reveals them by sliding */}
            <div className="swipe-actions">
                <button
                    ref={editBtnRef}
                    className="swipe-action-btn edit-btn"
                    onClick={handleEdit}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button
                    ref={deleteBtnRef}
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

            {/* Main card */}
            <div
                ref={cardRef}
                className={`person-card ${isOpen ? 'swiped' : ''}`}
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
