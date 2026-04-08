/**
 * RemindAR - Main Application
 * With real-time updates and fast recognition
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/DesktopLandingPage';
import { Camera } from './components/Camera';
import { AROverlay } from './components/AROverlay';
import { StatusIndicator } from './components/StatusIndicator';
import { RegistrationModal, RegistrationData } from './components/RegistrationModal';
import { DashboardSidebar } from './components/DashboardSidebar';
import { AskGeminiButton, GeminiResponse } from './components/AskGeminiButton';
import { GeminiResponseOverlay } from './components/GeminiResponseOverlay';
import { OnboardingModal } from './components/OnboardingModal';
import { PendingPersonNotification, PendingPerson } from './components/PendingPersonNotification';
import { useWebSocket } from './hooks/useWebSocket';
import { useFaceDetection } from './hooks/useFaceDetection';
import { useAuth } from './hooks/useAuth';
import { useUserRegion } from './hooks/useUserRegion';
import { usePendingPeople } from './hooks/usePendingPeople';
import { cropFaceFromVideo } from './utils/faceUtils';
import { Person, TrackedFace } from './types';
import { API, authFetch, setTokenGetter, setRegionGetter } from './config/api';
import { killAllStreams } from './utils/mediaStreamTracker';

// Recognition settings
const RECOGNITION_INTERVAL = 500; // 2 recognitions/sec is plenty
const BURST_DELAY = 50; // For burst recognition after visibility change

// LocalStorage key for onboarding completion
const ONBOARDING_KEY = 'remindar_onboarding_completed';

function App() {
    const [isDemoActive, setIsDemoActive] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Auth
    const { user, signInWithGoogle, logout, getIdToken } = useAuth();

    // Region selection for voice optimization
    const { regionCode, region, setRegionCode, allRegions } = useUserRegion();

    // Wire up auth token for all API calls
    useEffect(() => {
        setTokenGetter(getIdToken);
    }, [getIdToken]);

    // Wire up region getter for API calls
    useEffect(() => {
        setRegionGetter(() => regionCode);
    }, [regionCode]);

    // Registration/Modify modal state
    const [showModal, setShowModal] = useState(false);
    const [modalTrackId, setModalTrackId] = useState('');
    const [modalFaceImage, setModalFaceImage] = useState('');
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    // Dashboard sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Gemini response state
    const [geminiResponse, setGeminiResponse] = useState<GeminiResponse | null>(null);

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);

    // TEST: Temporary notification trigger for demo video (remove after recording)
    const [testNotification, setTestNotification] = useState<PendingPerson | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastSendTimeRef = useRef<Map<string, number>>(new Map());
    const burstModeRef = useRef(false);
    const facesRef = useRef<Map<string, TrackedFace>>(new Map());

    // Hooks - onDataChange clears send times for immediate re-recognition
    const handleDataChange = useCallback(() => {
        console.log('[App] Data changed, clearing send times for re-recognition');
        lastSendTimeRef.current.clear();
    }, []);

    const { status: wsStatus, sendFaceData, results, clearResult, clearAllResults } = useWebSocket({
        onDataChange: handleDataChange,
        enabled: isDemoActive, // Only connect when demo is active to prevent errors on landing page
        getToken: getIdToken,
    });
    const { faces, isModelLoaded, error: detectionError } = useFaceDetection(videoRef);

    // Helper to get face image for a track ID
    const getFaceImageForTrack = useCallback((trackId: string): string | null => {
        const face = facesRef.current.get(trackId);
        if (face && videoRef.current) {
            return cropFaceFromVideo(videoRef.current, face.bbox);
        }
        return null;
    }, []);

    // Pending people tracking (3-minute unknown face detection)
    const {
        currentNotification,
        pendingQueue,
        handleYes: handlePendingYes,
        handleNo: handlePendingNo,
        handleLater: handlePendingLater,
        removeFromQueue: removePendingFromQueue,
    } = usePendingPeople({
        faces,
        results,
        getFaceImage: getFaceImageForTrack,
        enabled: isDemoActive && cameraReady,
    });

    // Keep facesRef in sync — avoids putting `faces` in effect/callback deps
    // (must come after useFaceDetection which declares `faces`)
    useEffect(() => { facesRef.current = faces; }, [faces]);

    // Force kill all camera streams when demo is deactivated
    useEffect(() => {
        if (isDemoActive) return;

        // Run immediately and again after delays to catch late async streams
        killAllStreams();
        const t1 = setTimeout(killAllStreams, 300);
        const t2 = setTimeout(killAllStreams, 1000);
        const t3 = setTimeout(killAllStreams, 2000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [isDemoActive]);

    // Update dimensions
    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Immediate face recognition - can be called for burst mode
    // Reads facesRef so it doesn't re-memo on every detection cycle
    const sendAllFacesNow = useCallback(() => {
        if (!videoRef.current || wsStatus !== 'connected') return;

        for (const [trackId, face] of facesRef.current) {
            if (!face.isVisible) continue;

            const imageBase64 = cropFaceFromVideo(videoRef.current, face.bbox);
            if (imageBase64) {
                sendFaceData({
                    track_id: trackId,
                    image_base64: imageBase64,
                    bbox: face.bbox,
                    timestamp: Date.now(),
                });
                lastSendTimeRef.current.set(trackId, Date.now());
            }
        }
    }, [wsStatus, sendFaceData]);

    // Visibility change handler - CRITICAL for tab switching
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && cameraReady && wsStatus === 'connected') {
                console.log('[App] Tab visible - burst recognition');
                burstModeRef.current = true;

                // Immediately send all faces
                sendAllFacesNow();

                // Send again after short delays to catch up
                setTimeout(sendAllFacesNow, BURST_DELAY);
                setTimeout(sendAllFacesNow, BURST_DELAY * 2);
                setTimeout(sendAllFacesNow, BURST_DELAY * 3);

                // Exit burst mode
                setTimeout(() => { burstModeRef.current = false; }, BURST_DELAY * 4);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [cameraReady, wsStatus, sendAllFacesNow]);

    // Clear stale results when all faces disappear
    // This ensures fresh recognition when faces return to frame
    const prevVisibleCountRef = useRef(0);
    useEffect(() => {
        const visibleFaces = Array.from(faces.values()).filter(f => f.isVisible);
        const currentCount = visibleFaces.length;

        // When faces go from some to none, clear everything for fresh start
        if (prevVisibleCountRef.current > 0 && currentCount === 0) {
            console.log('[App] All faces left frame - clearing stale results for fresh recognition');
            clearAllResults();
            lastSendTimeRef.current.clear();
        }

        prevVisibleCountRef.current = currentCount;
    }, [faces, clearAllResults]);

    // Immediately recognize NEW faces (those without results yet)
    // Only triggers when faces Map identity changes (from detection hook)
    // but reads results via ref to avoid double-dependency churn
    const resultsRef = useRef(results);
    useEffect(() => { resultsRef.current = results; }, [results]);

    useEffect(() => {
        if (!videoRef.current || wsStatus !== 'connected') return;

        for (const [trackId, face] of faces) {
            if (!face.isVisible) continue;

            // If this face has no result yet, send immediately
            if (!resultsRef.current.has(trackId) && !lastSendTimeRef.current.has(trackId)) {
                const imageBase64 = cropFaceFromVideo(videoRef.current, face.bbox);
                if (imageBase64) {
                    console.log(`[App] New face detected: ${trackId.slice(0, 6)} - sending immediately`);
                    sendFaceData({
                        track_id: trackId,
                        image_base64: imageBase64,
                        bbox: face.bbox,
                        timestamp: Date.now(),
                    });
                    lastSendTimeRef.current.set(trackId, Date.now());
                }
            }
        }
    }, [faces, wsStatus, sendFaceData]);

    // Regular face recognition loop
    // Uses facesRef so the interval is NOT recreated on every detection cycle
    useEffect(() => {
        if (!cameraReady || wsStatus !== 'connected') return;

        const sendForRecognition = () => {
            const now = Date.now();

            for (const [trackId, face] of facesRef.current) {
                if (!face.isVisible) continue;

                const lastSend = lastSendTimeRef.current.get(trackId) || 0;
                const interval = burstModeRef.current ? BURST_DELAY : RECOGNITION_INTERVAL;

                if (now - lastSend >= interval) {
                    const imageBase64 = cropFaceFromVideo(videoRef.current!, face.bbox);
                    if (imageBase64) {
                        sendFaceData({
                            track_id: trackId,
                            image_base64: imageBase64,
                            bbox: face.bbox,
                            timestamp: now,
                        });
                        lastSendTimeRef.current.set(trackId, now);
                    }
                }
            }
        };

        const interval = setInterval(sendForRecognition, RECOGNITION_INTERVAL);
        return () => clearInterval(interval);
    }, [cameraReady, wsStatus, sendFaceData]);

    // Callbacks
    const handleCameraReady = useCallback(() => {
        setCameraReady(true);
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
            });
        }
        // Show onboarding if first time
        if (!localStorage.getItem(ONBOARDING_KEY)) {
            setShowOnboarding(true);
        }
    }, []);

    const handleCameraError = useCallback((error: string) => {
        setCameraError(error);
    }, []);

    // Handle onboarding completion
    const handleOnboardingComplete = useCallback(() => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
    }, []);

    // Handle pending person notification - Yes (open registration)
    const handlePendingPersonYes = useCallback((person: PendingPerson) => {
        handlePendingYes(person);
        // Open registration modal with the face image
        setModalTrackId(person.trackId);
        setModalFaceImage(person.faceImage);
        setEditingPerson(null);
        setShowModal(true);
    }, [handlePendingYes]);

    // Handle pending person from queue - add them
    const handleAddPendingPerson = useCallback((person: PendingPerson) => {
        removePendingFromQueue(person.trackId);
        // Open registration modal with the saved face image
        setModalTrackId(person.trackId);
        setModalFaceImage(person.faceImage);
        setEditingPerson(null);
        setShowModal(true);
    }, [removePendingFromQueue]);

    // Ensure video is playing (browser may pause it during dialogs)
    const resumeVideoPlayback = useCallback(() => {
        if (videoRef.current && videoRef.current.paused) {
            console.log('[App] Resuming video playback');
            videoRef.current.play().catch(e => console.error('[App] Video resume failed:', e));
        }
    }, []);

    // Open modal for NEW person
    const handleAddPerson = useCallback((trackId: string) => {
        const face = faces.get(trackId);
        if (face && videoRef.current) {
            setModalFaceImage(cropFaceFromVideo(videoRef.current, face.bbox) || '');
        }
        setModalTrackId(trackId);
        setEditingPerson(null);
        setShowModal(true);
    }, [faces]);

    // Open modal for EXISTING person (modify)
    const handleModifyPerson = useCallback((personId: string) => {
        for (const result of results.values()) {
            if (result.person?.id === personId) {
                setEditingPerson(result.person);
                setModalTrackId('');
                setModalFaceImage('');
                setShowModal(true);
                return;
            }
        }
    }, [results]);

    // Delete person
    const handleDeletePerson = useCallback(async (personId: string) => {
        if (!confirm('Delete this person? This cannot be undone.')) return;

        console.log('[App] Deleting person:', personId);

        try {
            const res = await authFetch(`${API.people}/${personId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');

            // Clear all results to trigger fresh recognition
            clearAllResults();

            // Force re-recognition burst
            setTimeout(sendAllFacesNow, 100);
            setTimeout(sendAllFacesNow, 300);

            console.log('[App] Deleted successfully');
        } catch (error) {
            console.error('[App] Delete error:', error);
            alert('Failed to delete. See console.');
        }
    }, [clearAllResults, sendAllFacesNow]);

    // Handle modal submit
    const handleModalSubmit = useCallback(async (data: RegistrationData) => {
        const isEditing = !!editingPerson;
        console.log('[App]', isEditing ? 'Updating:' : 'Creating:', data.name);

        try {
            if (isEditing && editingPerson) {
                await authFetch(`${API.people}/${editingPerson.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        relation: data.relation,
                        last_met: data.lastMet,
                        context: data.context,
                        language: data.language,
                    }),
                });
            } else {
                const createRes = await authFetch(API.people, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        relation: data.relation,
                        last_met: data.lastMet,
                        context: data.context,
                        language: data.language,
                    }),
                });

                if (!createRes.ok) throw new Error('Failed to create person');
                const person = await createRes.json();

                // Register face embedding
                if (data.faceImageBase64) {
                    console.log('[App] Registering face for:', person.id);
                    const faceRes = await authFetch(API.registerFace(person.id), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            track_id: data.trackId,
                            image_base64: data.faceImageBase64,
                        }),
                    });

                    if (!faceRes.ok) {
                        console.error('[App] Face registration failed:', await faceRes.text());
                        alert('Person created but face registration failed. Please try again.');
                    } else {
                        console.log('[App] Face registered successfully');
                    }
                } else {
                    console.warn('[App] No face image captured - person created without face embedding');
                    alert('Warning: No face image was captured. Person created but cannot be recognized.');
                }

                // Clear result to force re-recognition
                clearResult(data.trackId);
                lastSendTimeRef.current.delete(data.trackId);

                // Burst recognition for immediate update
                const bursts = [0, 100, 200, 300, 500];
                bursts.forEach(delay => {
                    setTimeout(() => {
                        const face = faces.get(data.trackId);
                        if (face && videoRef.current) {
                            const img = cropFaceFromVideo(videoRef.current, face.bbox);
                            if (img) {
                                sendFaceData({
                                    track_id: data.trackId,
                                    image_base64: img,
                                    bbox: face.bbox,
                                    timestamp: Date.now(),
                                });
                            }
                        }
                    }, delay);
                });
            }
        } catch (error) {
            console.error('[App] Error:', error);
            alert('Failed. See console.');
        }
    }, [editingPerson, clearResult, faces, sendFaceData]);

    // Landing page
    if (!isDemoActive) {
        return (
            <LandingPage
                onStartDemo={() => setIsDemoActive(true)}
                user={user}
                onSignIn={signInWithGoogle}
                onLogout={logout}
                region={region}
                allRegions={allRegions}
                onRegionChange={setRegionCode}
            />
        );
    }

    // Camera error
    if (cameraError) {
        return (
            <div className="error-container">
                <h1>Camera Access Required</h1>
                <p>{cameraError}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="app-container" ref={containerRef}>
            <StatusIndicator
                connectionStatus={wsStatus}
                facesDetected={Array.from(faces.values()).filter(f => f.isVisible).length}
                isModelLoaded={isModelLoaded}
                detectionError={detectionError}
            />

            <Camera
                ref={videoRef}
                onReady={handleCameraReady}
                onError={handleCameraError}
            />

            {cameraReady && dimensions.width > 0 && (
                <AROverlay
                    faces={faces}
                    results={results}
                    containerWidth={dimensions.width}
                    containerHeight={dimensions.height}
                    onAddPerson={handleAddPerson}
                    onModifyPerson={handleModifyPerson}
                    onDeletePerson={handleDeletePerson}
                />
            )}

            <button className="back-button" onClick={() => {
                // FORCE KILL all camera/media streams globally
                killAllStreams();
                setCameraReady(false);
                setCameraError(null);
                setIsDemoActive(false);
            }}>
                ← Back
            </button>

            {/* Dashboard toggle button */}
            <button
                className="menu-button"
                onClick={() => setSidebarOpen(true)}
                title="People Dashboard"
            >
                {/* Sidebar icon SVG */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
            </button>

            {/* Ask Gemini button */}
            <AskGeminiButton onResponse={setGeminiResponse} />

            {/* Dashboard Sidebar */}
            <DashboardSidebar
                isOpen={sidebarOpen}
                onClose={() => {
                    setSidebarOpen(false);
                    resumeVideoPlayback();
                }}
                pendingQueue={pendingQueue}
                onAddPendingPerson={handleAddPendingPerson}
                onRemovePendingPerson={removePendingFromQueue}
            />

            {/* Gemini Response Overlay */}
            <GeminiResponseOverlay
                response={geminiResponse}
                onClose={() => {
                    setGeminiResponse(null);
                    resumeVideoPlayback();
                }}
            />

            <RegistrationModal
                isOpen={showModal}
                trackId={modalTrackId}
                faceImageBase64={modalFaceImage}
                existingPerson={editingPerson}
                onClose={() => {
                    setShowModal(false);
                    // Clear all results to force fresh recognition
                    clearAllResults();
                    // Reset send times to allow immediate re-recognition
                    lastSendTimeRef.current.clear();
                    // Resume video in case it was paused
                    resumeVideoPlayback();
                }}
                onSubmit={handleModalSubmit}
            />

            {/* Onboarding Modal - shows on first camera ready */}
            <OnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
            />

            {/* Pending Person Notification - macOS-style slide-in from right */}
            <PendingPersonNotification
                person={testNotification || currentNotification}
                onYes={(p) => { setTestNotification(null); handlePendingPersonYes(p); }}
                onNo={(p) => { setTestNotification(null); handlePendingNo(p); }}
                onLater={(p) => { setTestNotification(null); handlePendingLater(p); }}
            />

            {/* TEMPORARY TEST BUTTON - For demo video recording only */}
            {isDemoActive && (
                <button
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 9999,
                        padding: '10px 16px',
                        background: 'rgba(255, 107, 107, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                    onClick={() => {
                        // Try to get a real face image from current faces
                        let faceImage = '';
                        for (const [trackId] of faces) {
                            const img = getFaceImageForTrack(trackId);
                            if (img) {
                                faceImage = img;
                                break;
                            }
                        }
                        setTestNotification({
                            trackId: 'test-' + Date.now(),
                            faceImage,
                            firstSeen: Date.now() - 3 * 60 * 1000,
                            duration: 180,
                            expiresAt: Date.now() + 2 * 60 * 60 * 1000,
                        });
                    }}
                >
                    Test Notification
                </button>
            )}
        </div>
    );
}

export default App;