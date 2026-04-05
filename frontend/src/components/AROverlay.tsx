/**
 * AR Overlay - Redesigned face labels
 * Typography:
 * - Name: Rozha One (serif)
 * - Relation: Inter Light Italic
 * - Context: Inter Medium
 */

import { useState, useEffect, useCallback } from 'react';
import { TrackedFace, RecognitionResult } from '../types';

// SVG Icons
const PencilIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

interface AROverlayProps {
    faces: Map<string, TrackedFace>;
    results: Map<string, RecognitionResult>;
    containerWidth: number;
    containerHeight: number;
    onAddPerson?: (trackId: string) => void;
    onModifyPerson?: (personId: string) => void;
    onDeletePerson?: (personId: string) => void;
}

interface FaceLabelState {
    showBox: boolean;
    isExpanded: boolean;
    fadeTimer: ReturnType<typeof setTimeout> | null;
}

const AUTO_FADE_DELAY = 3000; // 3 seconds

export function AROverlay({
    faces,
    results,
    containerWidth,
    containerHeight,
    onAddPerson,
    onModifyPerson,
    onDeletePerson,
}: AROverlayProps) {
    const [labelStates, setLabelStates] = useState<Map<string, FaceLabelState>>(new Map());
    const visibleFaces = Array.from(faces.values()).filter(f => f.isVisible);

    // Get or create state for a face
    const getState = useCallback((faceId: string): FaceLabelState => {
        return labelStates.get(faceId) || { showBox: false, isExpanded: false, fadeTimer: null };
    }, [labelStates]);

    // Update state for a face
    const updateState = useCallback((faceId: string, updates: Partial<FaceLabelState>) => {
        setLabelStates(prev => {
            const newMap = new Map(prev);
            const current = prev.get(faceId) || { showBox: false, isExpanded: false, fadeTimer: null };
            newMap.set(faceId, { ...current, ...updates });
            return newMap;
        });
    }, []);

    // Start auto-fade timer
    const startFadeTimer = useCallback((faceId: string) => {
        const state = labelStates.get(faceId);

        // Clear existing timer
        if (state?.fadeTimer) {
            clearTimeout(state.fadeTimer);
        }

        // Don't auto-fade if expanded
        if (state?.isExpanded) return;

        const timer = setTimeout(() => {
            updateState(faceId, { showBox: false, fadeTimer: null });
        }, AUTO_FADE_DELAY);

        updateState(faceId, { fadeTimer: timer });
    }, [labelStates, updateState]);

    // Handle hover enter (desktop)
    const handleMouseEnter = useCallback((faceId: string) => {
        const state = getState(faceId);
        if (state.fadeTimer) clearTimeout(state.fadeTimer);
        updateState(faceId, { showBox: true, fadeTimer: null });
    }, [getState, updateState]);

    // Handle hover leave (desktop)
    const handleMouseLeave = useCallback((faceId: string) => {
        const state = getState(faceId);
        if (!state.isExpanded) {
            startFadeTimer(faceId);
        }
    }, [getState, startFadeTimer]);

    // Handle click/tap (mobile)
    const handleClick = useCallback((faceId: string) => {
        const state = getState(faceId);
        if (!state.showBox) {
            updateState(faceId, { showBox: true });
            startFadeTimer(faceId);
        }
    }, [getState, updateState, startFadeTimer]);

    // Toggle expand
    const toggleExpand = useCallback((faceId: string) => {
        const state = getState(faceId);
        const newExpanded = !state.isExpanded;

        // Clear fade timer when expanding
        if (state.fadeTimer) clearTimeout(state.fadeTimer);

        updateState(faceId, {
            isExpanded: newExpanded,
            showBox: true,
            fadeTimer: null
        });

        // Start fade timer when collapsing
        if (!newExpanded) {
            startFadeTimer(faceId);
        }
    }, [getState, updateState, startFadeTimer]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            labelStates.forEach(state => {
                if (state.fadeTimer) clearTimeout(state.fadeTimer);
            });
        };
    }, []);

    return (
        <div className="ar-overlay">

            {/* Face labels */}
            {visibleFaces.map((face) => {
                const result = results.get(face.id);
                const hasResult = result !== undefined;
                const isKnown = result?.is_known ?? false;
                const person = result?.person;
                const relation = person?.relation || '';
                const context = person?.context || '';
                const language = person?.language || 'en';
                const state = getState(face.id);

                // Position: right of face
                const labelX = Math.min(
                    Math.max(20, (1 - face.bbox.x) * containerWidth + 30),
                    containerWidth - 300
                );
                const labelY = Math.max(
                    80,
                    (face.bbox.y + face.bbox.height / 2) * containerHeight - 50
                );

                // Determine display text
                let displayText = 'Scanning...';
                if (hasResult) {
                    displayText = isKnown ? '' : 'Not registered';
                }

                return (
                    <div key={face.id}>
                        {/* Face label */}
                        <div
                            className={`face-label-container ${state.showBox ? 'show-box' : ''} ${state.isExpanded ? 'expanded' : ''}`}
                            style={{ left: labelX, top: labelY }}
                            onMouseEnter={() => isKnown && handleMouseEnter(face.id)}
                            onMouseLeave={() => isKnown && handleMouseLeave(face.id)}
                            onClick={() => isKnown && handleClick(face.id)}
                        >
                            {/* Text content */}
                            <div className="face-label-text" data-lang={language}>
                                {isKnown ? (
                                    <>
                                        <span className="label-name">{person?.name || 'Unknown'}</span>
                                        {relation && <span className="label-relation">{relation}</span>}
                                        {context && <p className="label-context">{context}</p>}
                                    </>
                                ) : (
                                    <span className="label-status">{displayText}</span>
                                )}
                            </div>

                            {/* Blur box background - only visible on hover/click */}
                            <div className="face-label-box" />

                            {/* Action bar - expand button and actions on same row */}
                            {isKnown && state.showBox && (
                                <div className="action-bar">
                                    <button
                                        className={`expand-btn ${state.isExpanded ? 'rotated' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(face.id);
                                        }}
                                    >
                                        <ChevronIcon />
                                    </button>

                                    {/* Action buttons - visible when expanded */}
                                    {state.isExpanded && (
                                        <>
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    person?.id && onModifyPerson?.(person.id);
                                                }}
                                                title="Edit"
                                            >
                                                <PencilIcon />
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    person?.id && onDeletePerson?.(person.id);
                                                }}
                                                title="Delete"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Add button for unknown - positioned below the label */}
                        {!isKnown && onAddPerson && hasResult && (
                            <button
                                className="add-person-btn"
                                style={{ left: labelX, top: labelY + 60 }}
                                onClick={() => onAddPerson(face.id)}
                            >
                                Add this person
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
