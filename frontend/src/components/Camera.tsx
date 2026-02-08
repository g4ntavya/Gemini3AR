/**
 * Camera component for webcam capture
 * Handles getUserMedia with Safari compatibility
 * - Mobile: Flip camera button for front/back toggle
 * - Desktop: Button to open camera selection menu
 */

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react';

interface CameraDevice {
    deviceId: string;
    label: string;
}

interface CameraProps {
    onReady?: () => void;
    onError?: (error: string) => void;
}

// Detect mobile device
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// LocalStorage key for camera preference
const CAMERA_STORAGE_KEY = 'remindar_preferred_camera';

export const Camera = forwardRef<HTMLVideoElement, CameraProps>(
    ({ onReady, onError }, ref) => {
        const [isLoading, setIsLoading] = useState(true);
        const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
        const [showFlipButton, setShowFlipButton] = useState(false);

        // Desktop camera selection
        const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
        const [selectedCameraId, setSelectedCameraId] = useState<string>('');
        const [showCameraSelector, setShowCameraSelector] = useState(false);
        const [menuOpen, setMenuOpen] = useState(false);

        const localRef = useRef<HTMLVideoElement>(null);
        const videoRef = (ref as React.RefObject<HTMLVideoElement>) || localRef;
        const streamRef = useRef<MediaStream | null>(null);
        const menuRef = useRef<HTMLDivElement>(null);

        // Close menu when clicking outside
        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                    setMenuOpen(false);
                }
            };
            if (menuOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [menuOpen]);

        // Enumerate available cameras
        const enumerateCameras = useCallback(async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                const cameras: CameraDevice[] = videoDevices.map((device, index) => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${index + 1}`
                }));

                setAvailableCameras(cameras);

                // Check for saved camera preference
                const savedCameraId = localStorage.getItem(CAMERA_STORAGE_KEY);
                const savedCameraExists = cameras.some(c => c.deviceId === savedCameraId);

                if (cameras.length > 0 && !selectedCameraId) {
                    if (savedCameraId && savedCameraExists) {
                        // Use saved camera if it's still available
                        console.log('[Camera] Restoring saved camera preference');
                        setSelectedCameraId(savedCameraId);
                    } else {
                        // Fall back to first camera
                        if (savedCameraId && !savedCameraExists) {
                            console.log('[Camera] Saved camera no longer available, using default');
                            localStorage.removeItem(CAMERA_STORAGE_KEY);
                        }
                        setSelectedCameraId(cameras[0].deviceId);
                    }
                }

                // Show selector on desktop if multiple cameras available
                if (!isMobile() && cameras.length > 1) {
                    setShowCameraSelector(true);
                }

                console.log(`[Camera] Found ${cameras.length} cameras:`, cameras.map(c => c.label));

                return cameras;
            } catch (err) {
                console.error('[Camera] Failed to enumerate devices:', err);
                return [];
            }
        }, [selectedCameraId]);

        const initCamera = useCallback(async (deviceId?: string, facing?: 'user' | 'environment') => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            try {
                setIsLoading(true);

                const getUserMedia =
                    navigator.mediaDevices?.getUserMedia ||
                    // @ts-expect-error - Safari legacy
                    navigator.webkitGetUserMedia ||
                    // @ts-expect-error - Firefox legacy
                    navigator.mozGetUserMedia;

                if (!getUserMedia) {
                    throw new Error('Camera not supported in this browser');
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const videoConstraints: any = {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 30 },
                };

                if (deviceId && !isMobile()) {
                    videoConstraints.deviceId = { exact: deviceId };
                } else if (facing) {
                    videoConstraints.facingMode = facing;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: false,
                });

                streamRef.current = stream;

                if (!isMobile()) {
                    await enumerateCameras();
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            const playPromise = videoRef.current.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        setIsLoading(false);
                                        onReady?.();
                                        setShowFlipButton(isMobile());
                                        console.log('[Camera] Video stream ready');
                                    })
                                    .catch((err) => {
                                        console.error('[Camera] Play failed:', err);
                                        if (videoRef.current) {
                                            videoRef.current.muted = true;
                                            videoRef.current.play().then(() => {
                                                setIsLoading(false);
                                                onReady?.();
                                                setShowFlipButton(isMobile());
                                            });
                                        }
                                    });
                            }
                        }
                    };
                }
            } catch (err) {
                console.error('[Camera] Error accessing camera:', err);
                let errorMessage = 'Failed to access camera';

                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        errorMessage = 'Camera permission denied. Please allow camera access.';
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        errorMessage = 'No camera found. Please connect a camera.';
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                        errorMessage = 'Camera is in use by another application.';
                    } else if (err.name === 'OverconstrainedError') {
                        errorMessage = 'Camera does not meet requirements.';
                    } else {
                        errorMessage = err.message;
                    }
                }

                onError?.(errorMessage);
            }
        }, [onReady, onError, videoRef, enumerateCameras]);

        useEffect(() => {
            if (isMobile()) {
                initCamera(undefined, facingMode);
            } else {
                initCamera(selectedCameraId || undefined);
            }

            return () => {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };
        }, [facingMode, selectedCameraId, initCamera]);

        const handleFlipCamera = useCallback(() => {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }, []);

        const handleCameraSelect = useCallback((deviceId: string) => {
            console.log('[Camera] Switching to camera:', deviceId);
            setSelectedCameraId(deviceId);
            // Save preference to localStorage
            localStorage.setItem(CAMERA_STORAGE_KEY, deviceId);
            setMenuOpen(false);
        }, []);

        const shouldMirror = isMobile()
            ? facingMode === 'user'
            : true;

        // Get current camera label
        const currentCameraLabel = availableCameras.find(c => c.deviceId === selectedCameraId)?.label || 'Camera';

        return (
            <div className="video-container">
                <video
                    ref={videoRef}
                    className="video-feed"
                    autoPlay
                    playsInline
                    muted
                    webkit-playsinline="true"
                    style={{
                        opacity: isLoading ? 0 : 1,
                        transform: shouldMirror ? 'scaleX(-1)' : 'scaleX(1)'
                    }}
                />
                {isLoading && (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p className="loading-text">Starting camera...</p>
                    </div>
                )}

                {/* Flip camera button - mobile only */}
                {showFlipButton && (
                    <button
                        className="flip-camera-btn"
                        onClick={handleFlipCamera}
                        title="Flip camera"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                            <circle cx="12" cy="12" r="3" />
                            <path d="m18 22-3-3 3-3" />
                            <path d="m6 2 3 3-3 3" />
                        </svg>
                    </button>
                )}

                {/* Camera selector button + menu - desktop only */}
                {showCameraSelector && availableCameras.length > 1 && (
                    <div className="camera-selector-container" ref={menuRef}>
                        <button
                            className="camera-selector-btn"
                            onClick={() => setMenuOpen(!menuOpen)}
                            title={currentCameraLabel}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="camera-menu">
                                <div className="camera-menu-header">Select Camera</div>
                                {availableCameras.map(camera => (
                                    <button
                                        key={camera.deviceId}
                                        className={`camera-menu-item ${camera.deviceId === selectedCameraId ? 'active' : ''}`}
                                        onClick={() => handleCameraSelect(camera.deviceId)}
                                    >
                                        {camera.label}
                                        {camera.deviceId === selectedCameraId && (
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Camera.displayName = 'Camera';
