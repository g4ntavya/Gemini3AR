import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    duration?: number;
    stagger?: number;
    triggerOnScroll?: boolean;
    triggerStart?: string;
}

const SplitText: React.FC<SplitTextProps> = ({
    text,
    className = '',
    style = {},
    delay = 0,
    duration = 0.6,
    stagger = 0.03,
    triggerOnScroll = true,
    triggerStart = 'top 80%',
}) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const charsRef = useRef<HTMLSpanElement[]>([]);

    useEffect(() => {
        if (!containerRef.current || charsRef.current.length === 0) return;

        // Set initial state - hidden
        gsap.set(charsRef.current, {
            opacity: 0,
            y: 50,
            rotateX: -90,
        });

        const animateIn = () => {
            gsap.to(charsRef.current, {
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration,
                stagger,
                delay,
                ease: 'back.out(1.7)',
            });
        };

        if (triggerOnScroll) {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: triggerStart,
                onEnter: animateIn,
                once: true,
            });
        } else {
            animateIn();
        }

        return () => {
            ScrollTrigger.getAll().forEach((t) => {
                if (t.vars.trigger === containerRef.current) {
                    t.kill();
                }
            });
        };
    }, [delay, duration, stagger, triggerOnScroll, triggerStart]);

    const chars = text.split('');

    return (
        <span ref={containerRef} className={className} style={{ ...style, display: 'inline-block' }}>
            {chars.map((char, index) => (
                <span
                    key={index}
                    ref={(el) => {
                        if (el) charsRef.current[index] = el;
                    }}
                    style={{
                        display: 'inline-block',
                        transformOrigin: 'bottom center',
                        whiteSpace: char === ' ' ? 'pre' : 'normal',
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

export default SplitText;
