import { useEffect, useRef, useState, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import GlassesModel, { GlassesModelHandle } from './GlassesModel';
import SplitText from './SplitText';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

interface LandingPageProps {
    onStartDemo: () => void;
}

export function LandingPage({ onStartDemo }: LandingPageProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLElement>(null);
    const bgRef = useRef<HTMLImageElement>(null);
    const frameRef = useRef<HTMLImageElement>(null);
    const frameContainerRef = useRef<HTMLDivElement>(null);
    const leftTextRef = useRef<HTMLDivElement>(null);
    const rightTextRef = useRef<HTMLDivElement>(null);
    const bottomTextRef = useRef<HTMLParagraphElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);
    const bgContainerRef = useRef<HTMLDivElement>(null); // New ref for independent background parallax
    const featureVideoRef = useRef<HTMLVideoElement>(null);

    // Guaranteed Video Autoplay on Mobile
    useEffect(() => {
        if (featureVideoRef.current) {
            featureVideoRef.current.play().catch(error => {
                console.log("Autoplay prevented:", error);
            });
        }
    }, []);
    const contentTextRef = useRef<HTMLHeadingElement>(null);
    const tryDemoButtonRef = useRef<HTMLButtonElement>(null);

    // Features section refs
    const featuresSectionRef = useRef<HTMLElement>(null);
    const designedTextRef = useRef<HTMLHeadingElement>(null);
    const softwareTextRef = useRef<HTMLParagraphElement>(null);
    const glassesRef = useRef<GlassesModelHandle>(null);
    const glassesContainerRef = useRef<HTMLDivElement>(null);
    const geminiSectionRef = useRef<HTMLDivElement>(null);
    const geminiHeadingRef = useRef<HTMLHeadingElement>(null);
    const geminiFeature1Ref = useRef<HTMLDivElement>(null);
    const geminiFeature2Ref = useRef<HTMLDivElement>(null);
    const geminiFeature3Ref = useRef<HTMLDivElement>(null);
    const geminiFeature4Ref = useRef<HTMLDivElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null);

    const [typedText, setTypedText] = useState('');
    const [isTypingComplete, setIsTypingComplete] = useState(false);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const fullText = 'RemindAR is a real-time memory assistant that provides gentle, in the moment context during interactions.';

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        // Initial check is now in useState initializer
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Robust ScrollTrigger refresh to handle delayed loading of 3D models/images
    useEffect(() => {
        const timer1 = setTimeout(() => ScrollTrigger.refresh(), 500);
        const timer2 = setTimeout(() => ScrollTrigger.refresh(), 1500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    // Parallax handler moved to component scope for clean event listener management
    const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPos = (clientX / innerWidth) - 0.5;
        const yPos = (clientY / innerHeight) - 0.5;

        gsap.to(bgRef.current, {
            x: xPos * 10,
            y: yPos * 10,
            duration: 0.8,
            ease: 'power2.out'
        });

        gsap.to(frameRef.current, {
            x: xPos * 8,
            y: yPos * 5,
            duration: 0.8,
            ease: 'power2.out'
        });

        if (bgContainerRef.current) {
            gsap.to(bgContainerRef.current, {
                x: xPos * 8, // Moves 1:1 with frame
                y: yPos * 5,
                duration: 0.8,
                ease: 'power2.out'
            });
        }

        gsap.to(rightTextRef.current, {
            x: xPos * 20,
            y: yPos * 15,
            duration: 0.5,
            ease: 'power2.out'
        });

        gsap.to(bottomTextRef.current, {
            x: xPos * 20,
            y: yPos * 15,
            duration: 0.5,
            ease: 'power2.out'
        });

        gsap.to(leftTextRef.current, {
            x: xPos * 60,
            y: yPos * 40,
            duration: 0.4,
            ease: 'power2.out'
        });
    };

    useEffect(() => {
        const hero = heroRef.current;
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        const innerContent = innerContentRef.current;
        const bgContainer = bgContainerRef.current;
        const leftText = leftTextRef.current;
        const frameContainer = frameContainerRef.current;

        if (!hero || !wrapper || !content || !leftText || !frameContainer || !bgContainer) return;

        // Mouse parallax effect (existing)
        if (!isMobile) {
            hero.addEventListener('mousemove', handleMouseMove);
        }

        // ScrollTrigger animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: '+=150%',
                pin: true,
                scrub: isMobile ? true : 0.5, // Use true (0 delay) for mobile to prevent interpolation jitter
                invalidateOnRefresh: true,
            }
        });

        // Phase 1: RemindAR title fades out 
        const remindARTitle = leftText.querySelector('h1');
        const thisIsText = leftText.querySelector('span');

        if (remindARTitle && thisIsText) {
            // Both fade out together - faster
            tl.to(thisIsText, {
                scale: 1.2,
                opacity: 0,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);

            tl.to(remindARTitle, {
                scale: 1.25,
                opacity: 0,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        } else {
            tl.to(leftText, {
                scale: 1.2,
                opacity: 0,
                duration: 0.15,
                ease: 'power2.out'
            }, 0);
        }

        // Right text and bottom text fade out - faster
        tl.to([rightTextRef.current, bottomTextRef.current], {
            opacity: 0,
            duration: 0.12,
            ease: 'power2.out'
        }, 0.05);

        const isMobileView = window.innerWidth < 768;

        gsap.set(leftText, {
            xPercent: isMobileView ? 0 : 0,
            yPercent: isMobileView ? 0 : -50,
            scale: isMobileView ? 1 : 0.79,
            transformOrigin: isMobileView ? 'center center' : 'left center'
        });

        gsap.set(frameContainer, {
            xPercent: isMobileView ? -50 : -50,
            yPercent: isMobileView ? -50 : -38,
            scale: isMobileView ? 2.18 : 2.52, // Reverted to 4.5 as requested
            rotation: 0, // Mobile frame is pre-rotated in image
            x: 0,
            y: 0
        });

        gsap.set(content, {
            scale: isMobileView ? 0.85 : 0.58,
            rotation: 0,
            opacity: 1,
            transformOrigin: 'center center'
        });

        // Set inner content to be smaller initially (floating inside background)
        if (innerContent) {
            gsap.set(innerContent, {
                scale: 0.8,
                y: isMobileView ? 24 : 0, // Nudged down further (was 15)
                yPercent: 0,
                transformOrigin: 'center center'
            });
        }

        // Sync mask container initial state with frame container



        // Phase 2: Frame and background ZOOM IN towards center (no fade)
        tl.to(frameContainer, {
            scale: 12, // Target Scale
            xPercent: -50, // Maintain center position
            yPercent: isMobileView ? -50 : -38,
            duration: 0.5,
            ease: 'power2.inOut'
        }, 0.2);

        // Content zooms from scaled down to full size - SYNCED WITH FRAME (BUT SEPARATE)
        // Calculate exact scale to match frame expansion
        // Desktop: 2.52 -> 12 (Ratio ~4.76) => Content 0.58 * 4.76 = 2.76
        // Mobile: 4.5 -> 12 (Ratio ~2.67) => Content 0.85 * 2.67 = 2.27 BUT we need more to cover screen!
        const contentScaleTarget = isMobileView ? 4.5 : 2.76;
        const innerContentScaleTarget = isMobileView ? 0.35 : 0.36; // Increased from 0.22 to 0.35 to keep content larger

        tl.to(content, {
            scale: contentScaleTarget,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut'
        }, 0.2);

        // Inner Content zooms up to fill the background
        if (innerContent) {
            tl.to(innerContent, {
                scale: innerContentScaleTarget,
                yPercent: 0,
                y: isMobileView ? 13 : 0, // Land slightly lower than perfect center (was 5)
                duration: 0.5,
                ease: 'power2.inOut'
            }, 0.2);
        }

        // Frame fades to opacity 0 as it zooms (removes texture)
        tl.to(frameRef.current, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out'
        }, 0.35);

        // Background also zooms in towards center (no fade)
        tl.to(bgRef.current, {
            scale: 4, // Reverted zoom scale to 4 (desktop level) for natural fit
            duration: 0.5,
            ease: 'power2.inOut'
        }, 0.2);



        const tryDemoButton = tryDemoButtonRef.current;
        if (tryDemoButton) {
            gsap.set(tryDemoButton, {
                autoAlpha: 0,
                y: 10, // Subtle slide only
            });

            // Fast simple fade in
            tl.to(tryDemoButton, {
                autoAlpha: 1,
                y: 0,
                duration: 0.1, // Very fast relative to scroll
                ease: 'power1.out'
            }, 0.3); // Start much earlier (was 0.6)
        }

        return () => {
            hero.removeEventListener('mousemove', handleMouseMove);
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [isMobile]); // Re-run animation setup when mobile state changes

    // Typing effect on page load
    useEffect(() => {
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setTypedText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                setIsTypingComplete(true); // Hide cursor when done
            }
        }, 25); // Slower typing

        return () => clearInterval(typingInterval);
    }, []);

    // Features section scroll animations
    useEffect(() => {
        const featuresSection = featuresSectionRef.current;
        const designedText = designedTextRef.current;
        const softwareText = softwareTextRef.current;
        const glassesContainer = glassesContainerRef.current;

        if (!featuresSection || !designedText || !softwareText || !glassesContainer) return;

        // Set initial states - text hidden, glasses off-screen
        gsap.set(designedText, { opacity: 0, x: 80 });
        gsap.set(softwareText, { opacity: 0, y: 40 });
        gsap.set(glassesContainer, { x: 2500 }); // Far off-screen, completely invisible

        // Create timeline for Features section - GLASSES ONLY
        const featuresTl = gsap.timeline({
            scrollTrigger: {
                trigger: featuresSection,
                start: 'top top',
                end: '+=120%', // Reduced scroll area
                pin: true,
                scrub: isMobile ? true : 1.5, // Use true (0 delay) on mobile
                onUpdate: (self) => {
                    const progress = self.progress;

                    // Rotation happens in first 60% of scroll (slower)
                    if (progress <= 0.6) {
                        const rotationProgress = progress * 1.67; // Complete rotation by 0.6
                        const rotationY = rotationProgress * Math.PI * 2;
                        const rotationX = Math.sin(rotationProgress * Math.PI * 2) * 0.15;

                        if (glassesRef.current) {
                            const mobileScale = window.innerWidth < 768 ? 3.2 : 4; // Slightly reduced mobile scale from 4.0 to 3.2
                            glassesRef.current.setScale(mobileScale);
                            glassesRef.current.setRotation(rotationX, rotationY, 0);
                        }
                    }
                }
            }
        });

        // Animate glasses sliding in - SLOWER
        featuresTl.to(glassesContainer, {
            x: 0,
            duration: 0.5,
            ease: 'power2.out'
        }, 0);

        // Animate "Designed for the moments you SEE." text
        featuresTl.to(designedText, {
            opacity: 1,
            x: 0,
            duration: 0.2,
            ease: 'power2.out'
        }, 0);

        // Animate "software built for AR glasses..." text
        featuresTl.to(softwareText, {
            opacity: 1,
            y: 0,
            duration: 0.2,
            ease: 'power2.out'
        }, 0.25);

        // === PARALLAX EFFECT - Runs from 0.5 to 0.8 ===
        featuresTl.to(glassesContainer, {
            y: -150,
            duration: 0.3,
            ease: 'none'
        }, 0.5);

        if (textContainerRef.current) {
            featuresTl.to(textContainerRef.current, {
                y: -30,
                duration: 0.3,
                ease: 'none'
            }, 0.5);
        }

        // === GEMINI SECTION - Robust ScrollTrigger ===
        if (geminiSectionRef.current) {
            gsap.set(geminiSectionRef.current, { opacity: 0, y: 50 });

            ScrollTrigger.create({
                trigger: geminiSectionRef.current,
                start: 'top 90%',
                onEnter: () => {
                    gsap.to(geminiSectionRef.current, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        overwrite: true
                    });
                },
                // If the user scrolls back up, keep it visible or reset it?
                // For "award winning" feel, usually we want it to stay once triggered or re-fire cleanly.
                // Removing 'once: true' allows it to re-evaluate on refresh.
            });
        }

        // Feature cards
        const featureRefs = [geminiFeature1Ref, geminiFeature2Ref, geminiFeature3Ref, geminiFeature4Ref];
        featureRefs.forEach((ref, index) => {
            if (ref.current) {
                gsap.set(ref.current, {
                    opacity: 0,
                    y: 20,
                    filter: 'blur(4px)'
                });

                ScrollTrigger.create({
                    trigger: ref.current,
                    start: 'top 95%',
                    onEnter: () => {
                        gsap.to(ref.current, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            duration: 0.6,
                            delay: index * 0.1,
                            ease: 'power2.out',
                            overwrite: true
                        });
                    }
                });
            }
        });

        // Force ScrollTrigger to recalculate positions after all setup
        ScrollTrigger.refresh();

        return () => {
            const currentHero = heroRef.current;
            if (currentHero && !isMobile) {
                currentHero.removeEventListener('mousemove', handleMouseMove);
            }
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars.trigger === featuresSectionRef.current) {
                    t.kill();
                }
            });
        };
    }, [isMobile]);

    return (
        <div className="w-full">
            {/* Scroll Wrapper for pinning */}
            <div ref={wrapperRef} className="relative">
                {/* Hero Section - Green Background with Frame */}
                {/* Replaced 100dvh with 100vh to prevent iOS mobile address-bar resize jitter */}
                <section ref={heroRef} className="relative w-full h-[100vh] overflow-hidden" style={{ perspective: '1000px' }}>
                    {/* Dynamic SVG Background with Cutout Mask */}
                    {/* Background Image */}
                    <img
                        ref={bgRef}
                        src={isMobile ? "/bg_solid_mobile.png" : "/bg_solid.png"}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            scale: '1.1',
                            transform: isMobile ? 'scale(1.1)' : 'none', // Reduced initial scale for better fit
                            transformOrigin: 'center center'
                        }}
                    />

                    {/* Content Container */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-12 md:py-16 lg:py-20">
                        {/* Main Content Area */}
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Left Side - Title (RemindAR) */}


                            <div
                                ref={frameContainerRef}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: isMobile ? '47%' : '50%', // Visually centered on mobile
                                    transform: isMobile
                                        ? 'translate(-50%, -50%) scale(2.18)' // Synced with GSAP initial state
                                        : 'translate(-50%, -38%) scale(2.52)',
                                    zIndex: 40,
                                    transformStyle: 'preserve-3d',
                                    pointerEvents: 'none'
                                }}
                            >
                                <img
                                    ref={frameRef}
                                    src={isMobile ? "/frame_mobile.png" : "/framee.png"}
                                    alt="Ornate frame"
                                    className="relative z-40"
                                />
                            </div>

                            {/* Left Side - Title (RemindAR) - MOVED AFTER FRAME FOR Z-INDEX STACKING */}
                            <div
                                ref={leftTextRef}
                                className="absolute flex flex-col z-50 pointer-events-none"
                                style={{
                                    top: isMobile ? '5%' : '50%',
                                    left: isMobile ? '0' : 'max(-60px, min(0px, calc((100vw - 1440px) * 0.12)))',
                                    transform: isMobile ? 'none' : 'translateY(-50%)',
                                    scale: isMobile ? '1' : 'clamp(0.2, calc(0.79 * 100vw / 1440), 0.79)',
                                    transformOrigin: isMobile ? 'center center' : 'left center',
                                    transformStyle: 'preserve-3d',
                                    zIndex: 100,
                                    textAlign: isMobile ? 'center' as const : 'left' as const,
                                    alignItems: isMobile ? 'center' as const : 'flex-start' as const,
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                <span
                                    className="italic"
                                    style={{ fontFamily: 'Mileast', color: '#9E6B30', fontSize: isMobile ? '1.1rem' : 'clamp(0.7rem, 1.7vw, 1.5rem)' }}
                                >
                                    THIS IS
                                </span>
                                <h1
                                    className="tracking-wide whitespace-nowrap"
                                    style={{
                                        fontFamily: 'Transcity',
                                        fontSize: isMobile ? '17vw' : 'clamp(2.5rem, 11vw, 10rem)',
                                        marginTop: isMobile ? '-1.5rem' : 'clamp(-3rem, -3.3vw, -0.5rem)',
                                        filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.5))'
                                    }}
                                >
                                    <span style={{
                                        background: 'linear-gradient(180deg, #9E7B30 0%, #D8B64E 30%, #E8C85E 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}>Remind</span><span style={{ color: '#FF0000' }}>AR</span>
                                </h1>
                            </div>

                            {/* Content inside frame (visible and scaled down to fit initially) */}
                            <div
                                ref={contentRef}
                                className="absolute inset-0 flex items-center justify-center z-30"
                                style={{
                                    transform: isMobile ? 'scale(0.85)' : 'scale(0.58)',
                                    opacity: 1,
                                    transformOrigin: 'center center'
                                }}
                            >
                                {/* This is the container that holds the background and content */}
                                <div
                                    className="relative flex items-center justify-center overflow-hidden"
                                    style={{
                                        width: isMobile ? '56vw' : '75vw',
                                        height: isMobile ? '80vw' : '51vw',
                                        maxWidth: isMobile ? '750px' : '1100px',
                                        maxHeight: isMobile ? '1100px' : '750px',
                                        backgroundColor: '#F5F0E8'
                                    }}
                                >
                                    {/* Fully opaque inner container */}
                                    <div
                                        className="relative w-full h-full"
                                        style={{ backgroundColor: '#F5F0E8' }}
                                    >
                                        {/* Line Grid Background - FILLS CONTAINER & DOES NOT ZOOM WITH INNER CONTENT */}
                                        <div
                                            ref={bgContainerRef} // Moves independently
                                            className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                            style={{ zIndex: 0 }}
                                        >
                                            <img
                                                src="/Line_Grid.svg"
                                                alt=""
                                                className="w-full h-full object-cover"
                                                style={{ opacity: isMobile ? 0.25 : 0.15 }}
                                            />
                                        </div>

                                        {/* Inner Content Wrapper - Starts small (0.8), zooms up to 1 */}
                                        <div
                                            ref={innerContentRef}
                                            className={`relative w-full h-full ${isMobile ? 'flex flex-col-reverse p-6 justify-center gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-12'}`}
                                            style={{
                                                transformOrigin: 'center center',
                                                transform: 'scale(0.8)' // Synced with GSAP initial state
                                            }}
                                        >
                                            {/* Left Column - Text Content */}
                                            <div className={`relative z-10 ${isMobile ? 'text-center space-y-4' : 'space-y-6 md:space-y-8'}`}>
                                                <h2
                                                    ref={contentTextRef}
                                                    className={`${isMobile ? 'text-[4.6vw] leading-tight' : 'text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight'}`}
                                                    style={{ fontFamily: 'Moglan_DEMO', color: '#272728' }}
                                                >
                                                    <span className="underline decoration-1 underline-offset-2" style={{ textDecorationColor: '#272728' }}>RemindAR</span>{typedText.slice(8)}{!isTypingComplete && <span className="animate-pulse">|</span>}
                                                </h2>

                                                {/* Button and Paragraph - Visible on mobile now */}
                                                <button
                                                    ref={tryDemoButtonRef}
                                                    onClick={(e) => { e.preventDefault(); onStartDemo(); }}
                                                    onTouchEnd={(e) => { e.preventDefault(); onStartDemo(); }}
                                                    className="bg-remindar-button-brown flex-shrink-0 text-remindar-button-text text-[10px] sm:text-sm md:text-base px-4 py-2 md:px-6 md:py-3 hover:brightness-110 transition-all duration-300 relative z-50 cursor-pointer"
                                                    style={{ fontFamily: 'Mileast', fontStyle: 'italic', opacity: 0 }}
                                                >
                                                    Try Demo
                                                </button>
                                                <p
                                                    className="text-black text-[10px] sm:text-xs mt-2 opacity-0"
                                                    style={{ fontFamily: 'HelveticaNeue-UltraLight', opacity: 0 }}
                                                    ref={(el) => {
                                                        if (el) {
                                                            gsap.set(el, { opacity: 0, y: 10 });
                                                            ScrollTrigger.create({
                                                                trigger: el,
                                                                start: 'top 95%',
                                                                onEnter: () => {
                                                                    gsap.to(el, { opacity: 0.7, y: 0, duration: 0.5, delay: 0.3, ease: 'power2.out', overwrite: true });
                                                                }
                                                            });
                                                        }
                                                    }}
                                                >
                                                    (camera and mic required)
                                                </p>
                                            </div>

                                            {/* Right Column - Screenshot */}
                                            <div className={`relative z-10 ${isMobile ? 'w-full max-w-[75%] mx-auto' : ''}`}>
                                                <img
                                                    src="/screenshot_first.png"
                                                    alt="Web demo preview"
                                                    className="w-full h-auto"
                                                />
                                                <p
                                                    className="text-black italic text-[9px] sm:text-xs mt-1 text-center"
                                                    style={{ fontFamily: 'HelveticaNeue-UltraLight', opacity: 0.6 }}
                                                >
                                                    (Web demo preview)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Text */}
                    <div
                        ref={rightTextRef}
                        className="absolute z-20 pointer-events-none"
                        style={{
                            ...(isMobile
                                ? { bottom: 'calc(16% - 15px)', left: '50%', transform: 'translateX(-50%)', transformOrigin: 'center center', textAlign: 'center' as const, width: '90%' }
                                : { right: '4rem', top: '50%', transform: 'translateY(calc(-50% + 15px)) scale(1.3)', transformOrigin: 'right center', textAlign: 'right' as const }
                            )
                        }}
                    >
                        <p
                            className="text-white leading-relaxed"
                            style={{ fontFamily: 'HelveticaNeue-UltraLight', fontSize: isMobile ? '0.95rem' : undefined }}
                        >
                            For the faces you'd have<br />
                            framed if you hadn't<br />
                            forgotten.
                        </p>
                    </div>

                    {/* Bottom Text */}
                    <div className="absolute left-0 right-0 z-20 text-center pointer-events-none" style={{ bottom: isMobile ? '7%' : '2rem', padding: isMobile ? '0 1rem' : '0 2rem 2rem' }}>
                        <p
                            ref={bottomTextRef}
                            className="text-white text-center mx-auto leading-relaxed"
                            style={{
                                fontFamily: 'HelveticaNeue-UltraLight',
                                transform: isMobile ? 'scale(1)' : 'scale(1.5)',
                                fontSize: isMobile ? '0.8rem' : undefined,
                                maxWidth: isMobile ? '100%' : '42rem',
                                opacity: isMobile ? 0.7 : undefined
                            }}
                        >
                            Gemini powered assistant that helps people with memory challenges recognize loved ones and recall meaningful context.
                        </p>
                    </div>
                </section>
            </div>

            {/* Features Section */}
            <section
                ref={featuresSectionRef}
                className="relative w-full py-12 md:py-16 lg:py-20 min-h-[100vh] -mt-[1px]"
                style={{ backgroundColor: '#F5F0E8' }}
            >
                {/* Grid Line Background SVG - Behind everything */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.08, zIndex: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="features-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#272728" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#features-grid)" />
                </svg>

                {/* Progressive fade/blur at top */}
                <div
                    className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, #F5F0E8 0%, transparent 100%)',
                        zIndex: 1
                    }}
                />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Designed for the moments heading */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 md:mb-32">
                        {/* 3D Glasses Model Container - Smaller on mobile */}
                        <div
                            ref={glassesContainerRef}
                            className={`mb-8 md:mb-0 relative z-20 ${isMobile ? 'w-full h-[320px]' : 'w-[500px] h-[350px] md:w-[700px] md:h-[500px]'}`}
                        >
                            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                                <ambientLight intensity={0.6} />
                                <directionalLight position={[5, 5, 5]} intensity={1} />
                                <Suspense fallback={null}>
                                    <GlassesModel ref={glassesRef} />
                                    <Environment preset="studio" />
                                </Suspense>
                                <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
                            </Canvas>
                        </div>
                        {/* Designed for the moments - MOVED BACK INSIDE PINNED FLEX CONTAINER */}
                        <div
                            ref={textContainerRef}
                            className="text-left md:text-right space-y-6 max-w-full md:max-w-xl lg:max-w-2xl flex flex-col items-end justify-center"
                        >
                            <h3
                                ref={designedTextRef}
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-black leading-tight text-right pr-4"
                                style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                            >
                                Designed for the moments you SEE.
                            </h3>
                            <p
                                ref={softwareTextRef}
                                className="text-black text-lg md:text-xl lg:text-2xl leading-relaxed text-right"
                                style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                            >
                                software built for AR glasses, bringing memory and context into your field of view effortlessly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gemini & Features Section - Moved out of pinned section to prevent overlap */}
            <section
                className="relative w-full py-20 min-h-[100dvh]"
                style={{ backgroundColor: '#F5F0E8' }}
            >
                {/* Grid Line Background for continuity */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.08, zIndex: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="features-grid-3" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#272728" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#features-grid-3)" />
                </svg>

                {/* Powered by Gemini Section - Full page */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div
                        ref={geminiSectionRef}
                        className="min-h-[100dvh] flex flex-col justify-center py-20"
                    >
                        {/* Powered by Gemini Heading */}
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <img
                                src="/Google_Gemini_icon_2025.svg.png"
                                alt="Gemini"
                                className="w-12 h-12 md:w-16 md:h-16"
                            />
                            <h2
                                ref={geminiHeadingRef}
                                className="text-3xl sm:text-4xl md:text-5xl text-black"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                <SplitText
                                    text="Powered by Gemini 3 Flash"
                                    triggerOnScroll={true}
                                    triggerStart="top 85%"
                                    stagger={0.02}
                                    duration={0.5}
                                />
                            </h2>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto px-4">
                            {/* Feature 1 */}
                            <div ref={geminiFeature1Ref} className="space-y-2 text-center">
                                <h3
                                    className="text-xl md:text-2xl text-black font-bold"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Voice Transcription
                                </h3>
                                <p
                                    className="text-black text-base md:text-lg"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    Speak naturally in any language.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div ref={geminiFeature2Ref} className="space-y-2 text-center">
                                <h3
                                    className="text-xl md:text-2xl text-black font-bold"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Smart Field Extraction
                                </h3>
                                <p
                                    className="text-black text-base md:text-lg"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    Auto-fills name, relation, context.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div ref={geminiFeature3Ref} className="space-y-2 text-center">
                                <h3
                                    className="text-xl md:text-2xl text-black font-bold"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Context Memory Search
                                </h3>
                                <p
                                    className="text-black text-base md:text-lg"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    Query your contacts with natural language.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div ref={geminiFeature4Ref} className="space-y-2 text-center">

                                <h3
                                    className="text-xl md:text-2xl text-black font-bold"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Advanced Speech to Text
                                </h3>
                                <p
                                    className="text-black text-base md:text-lg"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    Continuous listening with 99% accuracy suitable for long conversations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notable Features List */}
                    <div className="mb-16 md:mb-20 mt-32 md:mt-48">
                        <h2
                            className="text-4xl sm:text-5xl md:text-6xl text-black mb-12 text-center"
                            style={{ fontFamily: 'Moglan_DEMO' }}
                        >
                            Notable Features
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
                            {/* Left Column - Features with Video */}
                            <div className="space-y-6">
                                {/* Hover Feature with Video */}
                                <div className="border-b border-black pb-4">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm mb-3">
                                        Interactive Face Labels Hover to reveal info and actions.
                                    </p>
                                    <div className="w-4/5 mx-auto">
                                        <video
                                            ref={featureVideoRef}
                                            src="/1768670517690173.mp4"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-auto rounded-lg"
                                        />
                                    </div>
                                    <p
                                        className="text-black italic text-[9px] sm:text-xs mt-2 text-center"
                                        style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                    >
                                        (Hover animation)
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Dashboard with Screenshot */}
                            <div className="space-y-6">
                                {/* Dashboard Feature with Screenshot */}
                                <div className="border-b border-black pb-4">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm mb-3">
                                        People Dashboard Swipeable cards with edit/delete.
                                    </p>
                                    <div className="w-4/5 mx-auto">
                                        <img
                                            src="/screenshot_bottom.png"
                                            alt="Dashboard view"
                                            className="w-full h-auto rounded-lg"
                                        />
                                    </div>
                                    <p
                                        className="text-black italic text-[9px] sm:text-xs mt-2 text-center"
                                        style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                    >
                                        (Dashboard view)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Features Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 mt-8">
                            <div className="space-y-4">
                                <div className="border-b border-black pb-3">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm">
                                        Cloud Sync Firebase + SQLite hybrid storage.
                                    </p>
                                </div>
                                <div className="border-b border-black pb-3">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm">
                                        Mobile Ready PWA with fullscreen camera support.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="border-b border-black pb-3">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm">
                                        Real-Time Recognition Instant face detection and matching.
                                    </p>
                                </div>
                                <div className="border-b border-black pb-3">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm">
                                        Offline Capable Works without internet using local cache.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Extra padding at bottom to prevent footer overlap */}
                <div className="h-16 w-full"></div>
            </section>

            {/* Footer Section */}
            <footer className="w-full bg-remindar-brown py-12 md:py-16 -mt-[1px]">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Brand */}
                        <div>
                            <h3
                                className="text-2xl md:text-3xl text-white mb-4"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                RemindAR
                            </h3>
                            <p
                                className="text-white text-sm"
                                style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                            >
                                A real-time memory assistant for AR glasses.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4
                                className="text-white font-bold text-sm mb-4"
                                style={{ fontFamily: 'HelveticaNeue-Medium' }}
                            >
                                Quick Links
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <button onClick={onStartDemo} className="text-white text-sm hover:text-gray-300 transition-colors text-left w-full" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
                                        Try Demo
                                    </button>
                                </li>
                                <li>
                                    <a href="#" className="text-white text-sm hover:text-gray-300 transition-colors" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-white text-sm hover:text-gray-300 transition-colors" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
                                        About
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4
                                className="text-white font-bold text-sm mb-4"
                                style={{ fontFamily: 'HelveticaNeue-Medium' }}
                            >
                                Contact
                            </h4>
                            <div className="space-y-3">
                                {/* Email */}
                                <a
                                    href="mailto:gantavya.rr@gmail.com"
                                    className="flex items-center gap-2 text-white text-sm hover:text-gray-300 transition-colors"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                    gantavya.rr@gmail.com
                                </a>
                                {/* Twitter */}
                                <a
                                    href="https://twitter.com/g4ntavya"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-white text-sm hover:text-gray-300 transition-colors"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    @g4ntavya
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-12 pt-6 border-t border-white/20">
                        <p
                            className="text-white/70 text-xs text-center"
                            style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                        >
                            © 2026 RemindAR. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer >
        </div >
    );
}
