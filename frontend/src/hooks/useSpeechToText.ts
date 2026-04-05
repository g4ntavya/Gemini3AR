/**
 * Speech-to-Text Hook with LLM Extraction
 * Optimized for real-time updates
 */

import { useRef, useCallback, useReducer } from 'react';
import { API, authFetch, getCurrentRegion } from '../config/api';

interface ExtractedInfo {
    name: string | null;
    relation: string | null;
    context: string | null;
    language: string;  // ISO 639-1 language code from Gemini
}

interface STTState {
    isRecording: boolean;
    isProcessing: boolean;
    transcript: string;
    extracted: ExtractedInfo | null;
    error: string | null;
    updateKey: number; // Forces re-render
}

type STTAction =
    | { type: 'START_RECORDING' }
    | { type: 'STOP_RECORDING' }
    | { type: 'SET_PROCESSING'; value: boolean }
    | { type: 'SET_TRANSCRIPT'; value: string }
    | { type: 'SET_EXTRACTED'; value: ExtractedInfo }
    | { type: 'SET_ERROR'; value: string }
    | { type: 'RESET' };

function reducer(state: STTState, action: STTAction): STTState {
    switch (action.type) {
        case 'START_RECORDING':
            return { ...state, isRecording: true, error: null, extracted: null, updateKey: state.updateKey + 1 };
        case 'STOP_RECORDING':
            return { ...state, isRecording: false, updateKey: state.updateKey + 1 };
        case 'SET_PROCESSING':
            return { ...state, isProcessing: action.value, updateKey: state.updateKey + 1 };
        case 'SET_TRANSCRIPT':
            return { ...state, transcript: action.value, updateKey: state.updateKey + 1 };
        case 'SET_EXTRACTED':
            return { ...state, extracted: action.value, isProcessing: false, updateKey: state.updateKey + 1 };
        case 'SET_ERROR':
            return { ...state, error: action.value, isProcessing: false, updateKey: state.updateKey + 1 };
        case 'RESET':
            return { ...state, transcript: '', extracted: null, error: null, updateKey: state.updateKey + 1 };
        default:
            return state;
    }
}

const initialState: STTState = {
    isRecording: false,
    isProcessing: false,
    transcript: '',
    extracted: null,
    error: null,
    updateKey: 0,
};

export function useSpeechToText() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        chunksRef.current = [];
        dispatch({ type: 'START_RECORDING' });

        try {
            // Try to find a suitable microphone that's NOT from an external camera
            // This prevents issues where camera reinitialization kills the audio track
            let audioConstraints: MediaTrackConstraints = {
                channelCount: 1,
                sampleRate: { ideal: 16000 },
                echoCancellation: true,
                noiseSuppression: true,
            };

            // Try to get audio devices and find a built-in mic
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');

                console.log('[STT] Available audio devices:', audioInputs.map(d => d.label));

                // Look for built-in microphone (avoid external camera mics)
                const builtInMic = audioInputs.find(d =>
                    d.label.toLowerCase().includes('built-in') ||
                    d.label.toLowerCase().includes('internal') ||
                    d.label.toLowerCase().includes('macbook') ||
                    d.deviceId === 'default'
                );

                if (builtInMic && builtInMic.deviceId) {
                    console.log('[STT] Using built-in mic:', builtInMic.label);
                    audioConstraints.deviceId = { exact: builtInMic.deviceId };
                }
            } catch (enumErr) {
                console.log('[STT] Could not enumerate devices, using default audio');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            });

            console.log('[STT] Got audio stream, tracks:', stream.getAudioTracks().map(t => t.label));

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            // Handle track ending unexpectedly (capture failure, device disconnect, etc.)
            stream.getAudioTracks().forEach(track => {
                track.onended = () => {
                    console.warn('[STT] Audio track ended unexpectedly');
                    // If we have data, still try to process it
                    if (chunksRef.current.length > 0 && mediaRecorder.state !== 'inactive') {
                        console.log('[STT] Stopping recorder due to track end, will process existing data');
                        try {
                            mediaRecorder.stop();
                        } catch {
                            // Ignore errors when stopping
                        }
                    } else {
                        dispatch({ type: 'SET_ERROR', value: 'Microphone disconnected' });
                        dispatch({ type: 'STOP_RECORDING' });
                    }
                };
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(500); // Smaller chunks
            console.log('[STT] Recording started');
        } catch (err) {
            console.error('[STT] Mic error:', err);
            dispatch({ type: 'SET_ERROR', value: 'Microphone access failed' });
            dispatch({ type: 'STOP_RECORDING' });
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<ExtractedInfo | null> => {
        const mediaRecorder = mediaRecorderRef.current;

        console.log('[STT] stopRecording called, recorder state:', mediaRecorder?.state);

        // Immediately update UI to show we're stopping
        dispatch({ type: 'STOP_RECORDING' });

        if (!mediaRecorder) {
            console.log('[STT] No media recorder available');
            return null;
        }

        if (mediaRecorder.state === 'inactive') {
            console.log('[STT] Recorder already inactive');
            return null;
        }

        // Show processing state immediately 
        dispatch({ type: 'SET_PROCESSING', value: true });
        console.log('[STT] Set processing state, stopping recorder...');

        return new Promise((resolve) => {
            // Set up the onstop handler BEFORE calling stop()
            mediaRecorder.onstop = async () => {
                console.log('[STT] onstop fired, processing audio...');

                // Stop all audio tracks
                mediaRecorder.stream.getTracks().forEach(track => track.stop());

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                console.log('[STT] Audio blob size:', audioBlob.size);

                if (audioBlob.size === 0) {
                    console.log('[STT] No audio data recorded');
                    dispatch({ type: 'SET_ERROR', value: 'No audio recorded' });
                    dispatch({ type: 'SET_PROCESSING', value: false });
                    resolve(null);
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    
                    // Add region for language/accent optimization
                    const region = getCurrentRegion();
                    if (region) {
                        formData.append('region', region);
                    }

                    console.log('[STT] Sending to Gemini...', region ? `(region: ${region})` : '');
                    const response = await authFetch(API.transcribeAndExtract, {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await response.json();
                    console.log('[STT] Gemini response:', data);

                    if (!data.success) {
                        dispatch({ type: 'SET_ERROR', value: 'Transcription failed' });
                        dispatch({ type: 'SET_PROCESSING', value: false });
                        resolve(null);
                        return;
                    }

                    // Set transcript
                    const text = data.text?.trim() || '';
                    dispatch({ type: 'SET_TRANSCRIPT', value: text });
                    console.log(`[STT] Transcribed (${data.language}):`, text);

                    // Extract fields
                    const info: ExtractedInfo = {
                        name: data.name || null,
                        relation: data.relation || null,
                        context: data.context || null,
                        language: data.language || 'en',
                    };

                    console.log('[STT] Extracted:', info);
                    dispatch({ type: 'SET_EXTRACTED', value: info });
                    resolve(info);

                } catch (err) {
                    console.error('[STT] Error:', err);
                    dispatch({ type: 'SET_ERROR', value: 'Processing failed' });
                    dispatch({ type: 'SET_PROCESSING', value: false });
                    resolve(null);
                }
            };

            // Now stop the recorder - this triggers onstop
            try {
                mediaRecorder.stop();
                console.log('[STT] stop() called successfully');
            } catch (err) {
                console.error('[STT] Error stopping recorder:', err);
                dispatch({ type: 'SET_ERROR', value: 'Failed to stop recording' });
                dispatch({ type: 'SET_PROCESSING', value: false });
                resolve(null);
            }
        });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    return {
        isRecording: state.isRecording,
        isProcessing: state.isProcessing,
        transcript: state.transcript,
        extracted: state.extracted,
        error: state.error,
        updateKey: state.updateKey,
        startRecording,
        stopRecording,
        reset,
    };
}
