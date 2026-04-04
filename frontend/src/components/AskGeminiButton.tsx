/**
 * Ask Gemini - Voice-based context queries
 * 
 * Flow:
 * 1. User clicks button → starts recording
 * 2. Audio sent to /api/ask-gemini
 * 3. Response displayed in overlay with TTS option
 */

import { useState, useRef, useCallback } from 'react';
import { Person } from '../types';
import { API, authFetch, getCurrentRegion } from '../config/api';

interface AskGeminiButtonProps {
    onResponse: (response: GeminiResponse) => void;
}

export interface GeminiResponse {
    text: string;
    matches: MatchedPerson[];
    query: string;
}

export interface MatchedPerson {
    person: Person;
    relevance: string;
}

export function AskGeminiButton({ onResponse }: AskGeminiButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const duration = Date.now() - startTimeRef.current;
                setIsRecording(false);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Create blob
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // VALIDATION: Don't send if too short or empty
                if (duration < 500 || audioBlob.size === 0) {
                    console.log('[AskGemini] Recording too short or empty, cancelling send.');
                    return;
                }

                setIsProcessing(true);

                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'query.webm');
                    
                    // Add region for language/accent optimization
                    const region = getCurrentRegion();
                    if (region) {
                        formData.append('region', region);
                    }

                    console.log(`[AskGemini] Sending query... (${audioBlob.size} bytes, ${duration}ms)`, region ? `region: ${region}` : '');
                    const res = await authFetch(API.askGemini, {
                        method: 'POST',
                        body: formData,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        console.log('[AskGemini] Response:', data);
                        onResponse(data);
                    } else {
                        console.error('[AskGemini] Error:', res.status);
                    }
                } catch (error) {
                    console.error('[AskGemini] Error:', error);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            startTimeRef.current = Date.now();
            setIsRecording(true);
            console.log('[AskGemini] Recording started...');

        } catch (error) {
            console.error('[AskGemini] Microphone error:', error);
        }
    }, [onResponse]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            console.log('[AskGemini] Recording stopped');
        }
    }, [isRecording]);

    const handleClick = () => {
        if (isRecording) {
            stopRecording();
        } else if (!isProcessing) {
            startRecording();
        }
    };

    return (
        <button
            className={`ask-gemini-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleClick}
            disabled={isProcessing}
        >
            {/* Gemini Star Icon - always white */}
            <svg className="gemini-star" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
                    fill="white"
                />
            </svg>
            <span className="btn-label">
                {isProcessing ? 'Thinking...' : isRecording ? 'Stop' : 'Ask'}
            </span>
        </button>
    );
}
