/**
 * Gemini Response Overlay - Shows context query results
 */

import { GeminiResponse, MatchedPerson } from './AskGeminiButton';

interface GeminiResponseOverlayProps {
    response: GeminiResponse | null;
    onClose: () => void;
}

export function GeminiResponseOverlay({ response, onClose }: GeminiResponseOverlayProps) {
    if (!response) return null;

    // TTS for the response
    const speakResponse = () => {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    // TTS for a specific person
    const speakPerson = (match: MatchedPerson) => {
        window.speechSynthesis.cancel();
        const text = `${match.person.name}. ${match.person.relation || ''}. ${match.person.context || ''}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="gemini-response-overlay">
            <div className="gemini-response-card">
                {/* Header */}
                <div className="response-header">
                    <div className="response-title">Gemini Insights</div>
                    <div className="response-actions">
                        {/* TTS Button */}
                        <button
                            className="action-btn speak-btn"
                            onClick={speakResponse}
                            title="Read aloud"
                        >
                            🔊
                        </button>
                        {/* Close Button */}
                        <button className="action-btn close-btn" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                {/* Query */}
                <div className="response-query">
                    <span className="query-label">You asked:</span>
                    <span className="query-text">"{response.query}"</span>
                </div>

                {/* Response text */}
                <div className="response-text">{response.text}</div>

                {/* Matched people */}
                {response.matches.length > 0 && (
                    <div className="response-matches">
                        <div className="matches-title">Related People:</div>
                        {response.matches.map((match, index) => (
                            <div key={index} className="match-card">
                                <div className="match-info">
                                    <div className="match-name">{match.person.name}</div>
                                    {match.person.relation && (
                                        <div className="match-relation">{match.person.relation}</div>
                                    )}
                                    {/* Show stored context instead of Gemini's relevance */}
                                    {match.person.context && (
                                        <div className="match-context">{match.person.context}</div>
                                    )}
                                </div>
                                {/* TTS for this person */}
                                <button
                                    className="action-btn speak-btn small"
                                    onClick={() => speakPerson(match)}
                                    title="Read aloud"
                                >
                                    🔊
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
