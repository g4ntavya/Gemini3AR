/**
 * Camera component for webcam capture
 * Handles getUserMedia with Safari compatibility
 * Includes flip camera button for mobile devices
 */

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react';

interface CameraProps {
    onReady?: () => void;
    onError?: (error: string) => void;
}

// Detect mobile device
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const Camera = forwardRef<HTMLVideoElement, CameraProps>(
    ({ onReady, onError }, ref) => {
        const [isLoading, setIsLoading] = useState(true);
        const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
        const [showFlipButton, setShowFlipButton] = useState(false);
        const localRef = useRef<HTMLVideoElement>(null);
        const videoRef = (ref as React.RefObject<HTMLVideoElement>) || localRef;
        const streamRef = useRef<MediaStream | null>(null);

        const initCamera = useCallback(async (facing: 'user' | 'environment') => {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            try {
                setIsLoading(true);

                // Check for getUserMedia support (with Safari fallback)
                const getUserMedia =
                    navigator.mediaDevices?.getUserMedia ||
                    // @ts-expect-error - Safari legacy
                    navigator.webkitGetUserMedia ||
                    // @ts-expect-error - Firefox legacy
                    navigator.mozGetUserMedia;

                if (!getUserMedia) {
                    throw new Error('Camera not supported in this browser');
                }

                // Request camera access with Safari-compatible constraints
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280, max: 1920 },
                        height: { ideal: 720, max: 1080 },
                        facingMode: facing,
                        // Safari-friendly frame rate
                        frameRate: { ideal: 30, max: 30 },
                    },
                    audio: false,
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // Wait for video to be ready
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            // Safari needs explicit play call
                            const playPromise = videoRef.current.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        setIsLoading(false);
                                        onReady?.();
                                        // Show flip button only on mobile after camera starts
                                        setShowFlipButton(isMobile());
                                        console.log('[Camera] Video stream ready, facing:', facing);
                                    })
                                    .catch((err) => {
                                        console.error('[Camera] Play failed:', err);
                                        // Try again with muted (autoplay policy)
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
        }, [onReady, onError, videoRef]);

        // Initialize camera on mount and when facing mode changes
        useEffect(() => {
            initCamera(facingMode);

            // Cleanup: stop tracks on unmount
            return () => {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };
        }, [facingMode, initCamera]);

        // Flip camera handler
        const handleFlipCamera = useCallback(() => {
            setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        }, []);

        return (
            <div className="video-container">
                <video
                    ref={videoRef}
                    className="video-feed"
                    autoPlay
                    playsInline
                    muted
                    // Safari-specific attributes

                    webkit-playsinline="true"
                    style={{
                        opacity: isLoading ? 0 : 1,
                        // Don't mirror back camera
                        transform: facingMode === 'environment' ? 'scaleX(1)' : 'scaleX(-1)'
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
            </div>
        );
    }
);

Camera.displayName = 'Camera';

