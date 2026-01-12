/**
 * AR Overlay - Labels for detected faces with expandable cards
 * Minecraft-style floating name tag above registered users
 * Edit (pencil) and Delete (trash) icon buttons
 */

import { useState } from 'react';
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

interface AROverlayProps {
    faces: Map<string, TrackedFace>;
    results: Map<string, RecognitionResult>;
    containerWidth: number;
    containerHeight: number;
    onAddPerson?: (trackId: string) => void;
    onModifyPerson?: (personId: string) => void;
    onDeletePerson?: (personId: string) => void;
}

export function AROverlay({
    faces,
    results,
    containerWidth,
    containerHeight,
    onAddPerson,
    onModifyPerson,
    onDeletePerson,
}: AROverlayProps) {
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const visibleFaces = Array.from(faces.values()).filter(f => f.isVisible);

    const toggleExpand = (trackId: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(trackId)) {
                next.delete(trackId);
            } else {
                next.add(trackId);
            }
            return next;
        });
    };

    return (
        <div className="ar-overlay">
            {/* Debug */}
            <div className="debug-indicator">
                {visibleFaces.length} face{visibleFaces.length !== 1 ? 's' : ''}
            </div>

            {/* Face labels */}
            {visibleFaces.map((face) => {
                const result = results.get(face.id);
                const isKnown = result?.is_known ?? false;
                const person = result?.person;
                const relation = result?.display_lines?.[1] || '';
                const isExpanded = expandedCards.has(face.id);

                // Position for the info card (right edge of face)
                const cardX = Math.min(
                    Math.max(20, (1 - face.bbox.x) * containerWidth + 20),
                    containerWidth - 280
                );
                const cardY = Math.min(
                    Math.max(60, (face.bbox.y + face.bbox.height / 2) * containerHeight),
                    containerHeight - 150
                );

                // Position for the Minecraft name tag (centered, ABOVE the face bbox)
                // Place it just outside the top edge of the bounding box
                const nameTagX = (1 - (face.bbox.x + face.bbox.width / 2)) * containerWidth;
                // bbox.y is the TOP of the face box, so we go above it
                const bboxTopY = face.bbox.y * containerHeight;
                const nameTagY = bboxTopY - 220; // 220px above the top of the face box

                return (
                    <div key={face.id}>
                        {/* Minecraft-style floating name tag - ONLY for registered users */}
                        {isKnown && person?.name && (
                            <div
                                className="minecraft-nametag"
                                style={{
                                    left: nameTagX,
                                    top: Math.max(30, nameTagY),
                                }}
                            >
                                <span className="nametag-text">{person.name}</span>
                            </div>
                        )}

                        {/* Info card */}
                        <div
                            className={`face-label ${isExpanded ? 'expanded' : ''}`}
                            style={{ left: cardX, top: cardY }}
                        >
                            <div className="label-content">
                                <div className="label-header">
                                    <div className="label-info">
                                        {/* Show "Scanning..." for unknown, relation for known */}
                                        {isKnown ? (
                                            <>
                                                {/* No name here - it's shown in the floating tag */}
                                                {relation && <span className="label-relation">{relation}</span>}
                                            </>
                                        ) : (
                                            <span className="label-name">Scanning...</span>
                                        )}
                                    </div>

                                    {/* Expand arrow for known persons */}
                                    {isKnown && (
                                        <button
                                            className={`expand-btn ${isExpanded ? 'rotated' : ''}`}
                                            onClick={() => toggleExpand(face.id)}
                                        >
                                            ›
                                        </button>
                                    )}
                                </div>

                                {/* Context - always visible for known persons */}
                                {isKnown && person?.context && (
                                    <p className="label-context">{person.context}</p>
                                )}

                                {/* Date - always visible */}
                                {isKnown && person?.last_met && (
                                    <span className="label-date">{person.last_met}</span>
                                )}

                                {/* Action buttons - only when expanded */}
                                {isKnown && (
                                    <div className={`action-buttons ${isExpanded ? 'show' : ''}`}>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => person?.id && onModifyPerson?.(person.id)}
                                            title="Edit"
                                        >
                                            <PencilIcon />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => person?.id && onDeletePerson?.(person.id)}
                                            title="Delete"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Add button for unknown */}
                            {!isKnown && onAddPerson && (
                                <button
                                    className="add-person-btn"
                                    onClick={() => onAddPerson(face.id)}
                                >
                                    Add this person
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
