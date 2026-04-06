/**
 * usePendingPeople Hook - Tracks unknown faces and manages pending queue
 * 
 * Features:
 * - Tracks how long unknown faces have been visible
 * - Triggers notification after 3 minutes of continuous visibility
 * - Manages "Later" queue with 2-hour auto-expiry
 * - Prevents duplicate notifications for same face
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TrackedFace, RecognitionResult } from '../types';
import { PendingPerson } from '../components/PendingPersonNotification';

// Configuration
const NOTIFICATION_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const LATER_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const CHECK_INTERVAL_MS = 10 * 1000; // Check every 10 seconds

interface UnknownFaceTracker {
    trackId: string;
    firstSeen: number;
    lastSeen: number;
    notified: boolean;
    dismissed: boolean; // User clicked No
    faceImage: string;
}

interface UsePendingPeopleProps {
    faces: Map<string, TrackedFace>;
    results: Map<string, RecognitionResult>;
    getFaceImage: (trackId: string) => string | null;
    enabled: boolean;
}

interface UsePendingPeopleReturn {
    // Current notification to show (null if none)
    currentNotification: PendingPerson | null;
    // Queue of people saved for "Later"
    pendingQueue: PendingPerson[];
    // Actions
    handleYes: (person: PendingPerson) => void;
    handleNo: (person: PendingPerson) => void;
    handleLater: (person: PendingPerson) => void;
    // Remove from pending queue (when user adds them from dashboard)
    removeFromQueue: (trackId: string) => void;
    // Clear expired entries manually
    clearExpired: () => void;
}

export function usePendingPeople({
    faces,
    results,
    getFaceImage,
    enabled,
}: UsePendingPeopleProps): UsePendingPeopleReturn {
    // Track unknown faces and their visibility duration
    const trackersRef = useRef<Map<string, UnknownFaceTracker>>(new Map());
    
    // Current notification to display
    const [currentNotification, setCurrentNotification] = useState<PendingPerson | null>(null);
    
    // Queue of people saved for "Later"
    const [pendingQueue, setPendingQueue] = useState<PendingPerson[]>([]);

    // Update trackers based on current faces and results
    useEffect(() => {
        if (!enabled) return;

        const now = Date.now();
        const trackers = trackersRef.current;

        // Update or create trackers for visible unknown faces
        for (const [trackId, face] of faces) {
            if (!face.isVisible) continue;

            const result = results.get(trackId);
            const isUnknown = !result || !result.is_known;

            if (isUnknown) {
                const existing = trackers.get(trackId);
                if (existing) {
                    // Update last seen time
                    existing.lastSeen = now;
                    // Update face image if we don't have one
                    if (!existing.faceImage) {
                        const img = getFaceImage(trackId);
                        if (img) existing.faceImage = img;
                    }
                } else {
                    // New unknown face
                    const faceImage = getFaceImage(trackId) || '';
                    trackers.set(trackId, {
                        trackId,
                        firstSeen: now,
                        lastSeen: now,
                        notified: false,
                        dismissed: false,
                        faceImage,
                    });
                }
            } else {
                // Face is now known, remove from tracking
                trackers.delete(trackId);
            }
        }

        // Clean up faces that are no longer visible (give 30 second grace period)
        const GRACE_PERIOD = 30 * 1000;
        for (const [trackId, tracker] of trackers) {
            const face = faces.get(trackId);
            if (!face || !face.isVisible) {
                if (now - tracker.lastSeen > GRACE_PERIOD) {
                    trackers.delete(trackId);
                }
            }
        }
    }, [faces, results, getFaceImage, enabled]);

    // Check for faces that have exceeded threshold
    useEffect(() => {
        if (!enabled) return;

        const checkThreshold = () => {
            const now = Date.now();
            const trackers = trackersRef.current;

            // Don't show new notification if one is already showing
            if (currentNotification) return;

            for (const [trackId, tracker] of trackers) {
                // Skip if already notified or dismissed
                if (tracker.notified || tracker.dismissed) continue;

                const duration = now - tracker.firstSeen;
                if (duration >= NOTIFICATION_THRESHOLD_MS) {
                    // Check if this face is in pending queue already
                    const inQueue = pendingQueue.some(p => p.trackId === trackId);
                    if (inQueue) continue;

                    // Trigger notification
                    tracker.notified = true;
                    
                    // Get latest face image
                    const latestImage = getFaceImage(trackId) || tracker.faceImage;
                    
                    setCurrentNotification({
                        trackId,
                        faceImage: latestImage,
                        firstSeen: tracker.firstSeen,
                        duration: Math.floor(duration / 1000),
                        expiresAt: 0, // Will be set if "Later" is clicked
                    });
                    break; // Only show one notification at a time
                }
            }
        };

        const interval = setInterval(checkThreshold, CHECK_INTERVAL_MS);
        checkThreshold(); // Run immediately

        return () => clearInterval(interval);
    }, [enabled, currentNotification, pendingQueue, getFaceImage]);

    // Auto-expire pending queue entries
    useEffect(() => {
        const cleanupExpired = () => {
            const now = Date.now();
            setPendingQueue(prev => prev.filter(p => p.expiresAt > now));
        };

        const interval = setInterval(cleanupExpired, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Handle "Yes" - user wants to add this person now
    const handleYes = useCallback((person: PendingPerson) => {
        setCurrentNotification(null);
        // Remove from trackers
        trackersRef.current.delete(person.trackId);
        // The parent component will handle opening the registration modal
    }, []);

    // Handle "No" - user doesn't want to add this person
    const handleNo = useCallback((person: PendingPerson) => {
        setCurrentNotification(null);
        // Mark as dismissed in tracker
        const tracker = trackersRef.current.get(person.trackId);
        if (tracker) {
            tracker.dismissed = true;
        }
    }, []);

    // Handle "Later" - save to queue with 2-hour expiry
    const handleLater = useCallback((person: PendingPerson) => {
        setCurrentNotification(null);
        
        const pendingPerson: PendingPerson = {
            ...person,
            expiresAt: Date.now() + LATER_EXPIRY_MS,
        };
        
        setPendingQueue(prev => {
            // Don't add duplicates
            if (prev.some(p => p.trackId === person.trackId)) {
                return prev;
            }
            return [...prev, pendingPerson];
        });

        // Remove from active trackers
        trackersRef.current.delete(person.trackId);
    }, []);

    // Remove from pending queue (when added from dashboard)
    const removeFromQueue = useCallback((trackId: string) => {
        setPendingQueue(prev => prev.filter(p => p.trackId !== trackId));
    }, []);

    // Manually clear expired entries
    const clearExpired = useCallback(() => {
        const now = Date.now();
        setPendingQueue(prev => prev.filter(p => p.expiresAt > now));
    }, []);

    return {
        currentNotification,
        pendingQueue,
        handleYes,
        handleNo,
        handleLater,
        removeFromQueue,
        clearExpired,
    };
}
