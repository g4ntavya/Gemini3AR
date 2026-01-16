/**
 * Swipeable Person Card - iOS style swipe with GSAP spring animations
 * 
 * Features:
 * - Real-time tracking for touch, mouse, and trackpad
 * - Spring bounce effect on card (overshoots then bounces back)
 * - Icons scale up smoothly
 * - Consistent 8px gaps everywhere
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Person } from '../types';
import gsap from 'gsap';

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
    const isDraggingRef = useRef(false);
    const offsetRef = useRef(0);
    const startXRef = useRef(0);
    const startOffsetRef = useRef(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const editBtnRef = useRef<HTMLButtonElement>(null);
    const deleteBtnRef = useRef<HTMLButtonElement>(null);

    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Update visuals during drag (no animation)
    const updateVisuals = useCallback((offset: number) => {
        const card = cardRef.current;
        const editBtn = editBtnRef.current;
        const deleteBtn = deleteBtnRef.current;

        if (!card || !editBtn || !deleteBtn) return;

        const clamped = Math.max(0, Math.min(ACTION_WIDTH, offset));
        offsetRef.current = clamped;

        const progress = clamped / ACTION_WIDTH;

        // Card follows directly
        gsap.set(card, { x: -clamped });

        // Buttons scale based on progress
        gsap.set(editBtn, {
            scale: 0.5 + (progress * 0.5),
            opacity: progress
        });
        gsap.set(deleteBtn, {
            scale: 0.5 + (progress * 0.5),
            opacity: progress
        });
    }, []);

    // Animate to final position with spring bounce
    const animateToPosition = useCallback((targetOffset: number) => {
        const card = cardRef.current;
        const editBtn = editBtnRef.current;
        const deleteBtn = deleteBtnRef.current;

        if (!card || !editBtn || !deleteBtn) return;

        offsetRef.current = targetOffset;
        const isOpening = targetOffset > 0;

        // Card animation with spring overshoot
        gsap.to(card, {
            x: -targetOffset,
            duration: 0.6,
            ease: 'elastic.out(1, 0.5)', // Bouncy spring
        });

        // Buttons pop in/out
        gsap.to(editBtn, {
            scale: isOpening ? 1 : 0.5,
            opacity: isOpening ? 1 : 0,
            duration: 0.4,
            ease: 'back.out(2)',
        });
        gsap.to(deleteBtn, {
            scale: isOpening ? 1 : 0.5,
            opacity: isOpening ? 1 : 0,
            duration: 0.4,
            ease: 'back.out(2)',
            delay: 0.03,
        });
    }, []);

    // Snap to open or closed
    const snapToPosition = useCallback(() => {
        isDraggingRef.current = false;
        const shouldOpen = offsetRef.current >= ACTION_WIDTH * SNAP_THRESHOLD;
        setIsOpen(shouldOpen);
        animateToPosition(shouldOpen ? ACTION_WIDTH : 0);
    }, [animateToPosition]);

    // Kill animations
    const killAnimations = useCallback(() => {
        gsap.killTweensOf([cardRef.current, editBtnRef.current, deleteBtnRef.current]);
    }, []);

    // Start drag
    const startDrag = useCallback((clientX: number) => {
        killAnimations();
        isDraggingRef.current = true;
        startXRef.current = clientX;
        startOffsetRef.current = offsetRef.current;
    }, [killAnimations]);

    // Update drag
    const updateDrag = useCallback((clientX: number) => {
        if (!isDraggingRef.current) return;
        const diff = startXRef.current - clientX;
        updateVisuals(startOffsetRef.current + diff);
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
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.relatedTarget === null && isDraggingRef.current) endDrag();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [updateDrag, endDrag]);

    // Wheel/trackpad
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) {
                e.preventDefault();
                killAnimations();

                const newOffset = offsetRef.current + (e.deltaX * 0.7);
                updateVisuals(newOffset);

                if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = setTimeout(snapToPosition, 120);
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        };
    }, [killAnimations, updateVisuals, snapToPosition]);

    // Close actions
    const closeActions = useCallback(() => {
        setIsOpen(false);
        animateToPosition(0);
    }, [animateToPosition]);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        const p = person;
        closeActions();
        setTimeout(() => onEdit(p), 350);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        const p = person;
        closeActions();
        setTimeout(() => onDelete(p), 350);
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
