/**
 * Swipeable Person Card - iOS style swipe with GSAP animations
 * Real-time tracking for touch, mouse drag, and trackpad
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

const ACTION_WIDTH = 136; // width of action buttons area
const SNAP_THRESHOLD = 0.2; // 20% to snap open

export function SwipeableCard({ person, onEdit, onDelete, onSpeak }: SwipeableCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const offsetRef = useRef(0);
    const startXRef = useRef(0);
    const startOffsetRef = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Animate to position using GSAP
    const animateTo = useCallback((targetOffset: number, isSnap: boolean = false) => {
        if (!cardRef.current || !actionsRef.current) return;

        const clampedOffset = Math.max(0, Math.min(ACTION_WIDTH, targetOffset));
        offsetRef.current = clampedOffset;

        if (isSnap) {
            // Spring animation for snap
            gsap.to(cardRef.current, {
                x: -clampedOffset,
                duration: 0.5,
                ease: 'elastic.out(1, 0.75)',
            });
            gsap.to(actionsRef.current, {
                x: ACTION_WIDTH - clampedOffset,
                opacity: clampedOffset / ACTION_WIDTH,
                duration: 0.5,
                ease: 'elastic.out(1, 0.75)',
            });
        } else {
            // Immediate follow during drag
            gsap.set(cardRef.current, { x: -clampedOffset });
            gsap.set(actionsRef.current, {
                x: ACTION_WIDTH - clampedOffset,
                opacity: Math.min(1, clampedOffset / (ACTION_WIDTH * 0.5))
            });
        }
    }, []);

    // Snap to open or closed
    const snapToPosition = useCallback(() => {
        const threshold = ACTION_WIDTH * SNAP_THRESHOLD;
        const newIsOpen = offsetRef.current >= threshold;

        setIsOpen(newIsOpen);
        setIsDragging(false);
        animateTo(newIsOpen ? ACTION_WIDTH : 0, true);
    }, [animateTo]);

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        gsap.killTweensOf([cardRef.current, actionsRef.current]);
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX;
        startOffsetRef.current = offsetRef.current;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const diff = startXRef.current - e.touches[0].clientX;
        animateTo(startOffsetRef.current + diff, false);
    }, [isDragging, animateTo]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        snapToPosition();
    }, [isDragging, snapToPosition]);

    // Mouse drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        gsap.killTweensOf([cardRef.current, actionsRef.current]);
        setIsDragging(true);
        startXRef.current = e.clientX;
        startOffsetRef.current = offsetRef.current;
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const diff = startXRef.current - e.clientX;
            animateTo(startOffsetRef.current + diff, false);
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
    }, [isDragging, animateTo, snapToPosition]);

    // Wheel/trackpad - real-time tracking
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.3) {
                e.preventDefault();
                gsap.killTweensOf([cardRef.current, actionsRef.current]);
                setIsDragging(true);

                const newOffset = offsetRef.current + e.deltaX;
                animateTo(newOffset, false);

                if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
                snapTimeoutRef.current = setTimeout(() => snapToPosition(), 100);
            }
        };

        card.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            card.removeEventListener('wheel', handleWheel);
            if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        };
    }, [animateTo, snapToPosition]);

    const closeActions = useCallback(() => {
        setIsOpen(false);
        setIsDragging(false);
        animateTo(0, true);
    }, [animateTo]);

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

    return (
        <div className="swipeable-card-container">
            {/* Action buttons */}
            <div
                ref={actionsRef}
                className="swipe-actions"
                style={{ transform: `translateX(${ACTION_WIDTH}px)`, opacity: 0 }}
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
