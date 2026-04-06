/**
 * Onboarding Modal - Shows tutorial slides after first camera permission
 */

import { useState } from 'react';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

interface Slide {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const slides: Slide[] = [
    {
        title: 'Welcome to RemindAR',
        description: "Your AI-powered memory assistant. Let's get you started!",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="onboarding-icon">
                <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        title: 'Register Faces',
        description: "See someone new? Tap 'Add this person' to save them to your memory.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="onboarding-icon">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="12" x2="16" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        title: 'Speak Naturally',
        description: "Tap the mic and speak in any language: 'This is my friend Raj from work.'",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="onboarding-icon">
                <rect x="9" y="2" width="6" height="11" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 10V11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11V10" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="18" x2="12" y2="22" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="22" x2="16" y2="22" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
    {
        title: 'Your Dashboard',
        description: 'Tap the menu to view, search, and manage all your saved people.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="onboarding-icon">
                <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="9" y1="3" x2="9" y2="21" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ),
    },
];

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    if (!isOpen) return null;

    const isLastSlide = currentSlide === slides.length - 1;
    const slide = slides[currentSlide];

    const handleNext = () => {
        if (isLastSlide) {
            onComplete();
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card">
                {/* Skip button */}
                <button className="onboarding-skip" onClick={handleSkip}>
                    Skip
                </button>

                {/* Icon */}
                <div className="onboarding-icon-container">
                    {slide.icon}
                </div>

                {/* Content */}
                <h2 className="onboarding-title">{slide.title}</h2>
                <p className="onboarding-description">{slide.description}</p>

                {/* Dots indicator */}
                <div className="onboarding-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`onboarding-dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Next/Get Started button */}
                <button className="onboarding-next" onClick={handleNext}>
                    {isLastSlide ? 'Get Started' : 'Next'}
                </button>
            </div>
        </div>
    );
}
