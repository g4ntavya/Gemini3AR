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
                setIsRecording(false);
                setIsProcessing(true);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Create blob and send to API
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'query.webm');

                    console.log('[AskGemini] Sending query...');
                    const res = await fetch('http://localhost:8000/api/ask-gemini', {
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
            {isProcessing ? (
                <span className="spinner">⏳</span>
            ) : isRecording ? (
                <span className="recording-icon">🎤</span>
            ) : (
                <span className="gemini-icon">✨</span>
            )}
            <span className="btn-label">
                {isProcessing ? 'Thinking...' : isRecording ? 'Listening...' : 'Ask Gemini'}
            </span>
        </button>
    );
}
