import { useEffect, useRef, useState, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import GlassesModel, { GlassesModelHandle } from './GlassesModel';
import SplitText from './SplitText';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

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
    const [isMobile, setIsMobile] = useState(false);
    const fullText = 'RemindAR is a real-time memory assistant that provides gentle, in the moment context during interactions.';

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const hero = heroRef.current;
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        const leftText = leftTextRef.current;
        const frameContainer = frameContainerRef.current;

        if (!hero || !wrapper || !content || !leftText || !frameContainer) return;

        // Mouse parallax effect (existing)
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

        hero.addEventListener('mousemove', handleMouseMove);

        // ScrollTrigger animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: wrapper,
                start: 'top top',
                end: '+=200%',
                pin: true,
                scrub: 0.5,
            }
        });

        // Phase 1: RemindAR title fades out - FASTER and smooth
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

        // Ensure frame stays centered - set initial position explicitly
        // FIX: Explicitly set scales here to ensure GSAP doesn't lose them when parsing inline styles
        const isMobileView = window.innerWidth < 768;

        gsap.set(leftText, {
            yPercent: -50,
            scale: 0.79,
            transformOrigin: 'left center'
        });

        gsap.set(frameContainer, {
            xPercent: -50,
            yPercent: -42,
            scale: isMobileView ? 1.8 : 2.42,
            rotation: isMobileView ? 90 : 0,
            x: 0,
            y: 0
        });

        gsap.set(content, {
            scale: isMobileView ? 0.35 : 0.45,
            rotation: isMobileView ? 90 : 0,
            opacity: 1,
            transformOrigin: 'center center'
        });

        // Phase 2: Frame and background ZOOM IN towards center (no fade)
        tl.to(frameContainer, {
            scale: 12,
            xPercent: -50, // Maintain center position
            yPercent: -42,
            duration: 0.5,
            ease: 'power2.inOut'
        }, 0.2);

        // Frame fades to opacity 0 as it zooms (removes texture)
        tl.to(frameRef.current, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out'
        }, 0.35);

        // Background also zooms in towards center (no fade)
        tl.to(bgRef.current, {
            scale: 4,
            duration: 0.5,
            ease: 'power2.inOut'
        }, 0.2);

        // Content zooms from scaled down to full size
        tl.to(content, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
        }, 0.45);

        // Animate the Try Demo button with cool reveal after scroll completes
        const tryDemoButton = tryDemoButtonRef.current;
        if (tryDemoButton) {
            gsap.set(tryDemoButton, {
                scale: 0,
                opacity: 0,
                y: 20
            });

            tl.to(tryDemoButton, {
                scale: 1,
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'back.out(1.7)'
            }, 0.75);
        }

        return () => {
            hero.removeEventListener('mousemove', handleMouseMove);
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

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
                scrub: 1.5, // Slower scrub
                onUpdate: (self) => {
                    const progress = self.progress;

                    // Rotation happens in first 60% of scroll (slower)
                    if (progress <= 0.6) {
                        const rotationProgress = progress * 1.67; // Complete rotation by 0.6
                        const rotationY = rotationProgress * Math.PI * 2;
                        const rotationX = Math.sin(rotationProgress * Math.PI * 2) * 0.15;

                        if (glassesRef.current) {
                            const mobileScale = window.innerWidth < 768 ? 2.5 : 4;
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

        // === GEMINI SECTION - SEPARATE ScrollTrigger that animates when visible ===
        if (geminiSectionRef.current) {
            gsap.set(geminiSectionRef.current, { opacity: 0, y: 80 });

            ScrollTrigger.create({
                trigger: geminiSectionRef.current,
                start: 'top 80%',
                onEnter: () => {
                    gsap.to(geminiSectionRef.current, {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                },
                once: true
            });
        }

        // Gemini heading - animates when visible
        if (geminiHeadingRef.current) {
            gsap.set(geminiHeadingRef.current, {
                opacity: 0,
                scale: 0.9,
                letterSpacing: '0.3em'
            });

            ScrollTrigger.create({
                trigger: geminiHeadingRef.current,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(geminiHeadingRef.current, {
                        opacity: 1,
                        scale: 1,
                        letterSpacing: '0.02em',
                        duration: 0.6,
                        ease: 'power3.out'
                    });
                },
                once: true
            });
        }

        // Feature cards - each animates when it scrolls into view
        const featureRefs = [geminiFeature1Ref, geminiFeature2Ref, geminiFeature3Ref, geminiFeature4Ref];
        featureRefs.forEach((ref, index) => {
            if (ref.current) {
                gsap.set(ref.current, {
                    opacity: 0,
                    y: 30,
                    filter: 'blur(6px)'
                });

                ScrollTrigger.create({
                    trigger: ref.current,
                    start: 'top 90%',
                    onEnter: () => {
                        gsap.to(ref.current, {
                            opacity: 1,
                            y: 0,
                            filter: 'blur(0px)',
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: 'power2.out'
                        });
                    },
                    once: true
                });
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars.trigger === featuresSection) {
                    t.kill();
                }
            });
        };
    }, []);

    return (
        <div className="w-full" style={{ background: '#F5F0E6' }}>
            {/* Scroll Wrapper for pinning */}
            <div ref={wrapperRef} className="relative">
                {/* Hero Section - Green Background with Frame */}
                <section ref={heroRef} className="relative w-full h-screen overflow-hidden" style={{ perspective: '1000px' }}>
                    {/* Background Image */}
                    <img
                        ref={bgRef}
                        src="/bg_final.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            scale: '1.1',
                            transform: isMobile ? 'rotate(90deg) scale(1.5)' : 'none',
                            transformOrigin: 'center center'
                        }}
                    />

                    {/* Content Container */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-12 md:py-16 lg:py-20">
                        {/* Main Content Area */}
                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Left Side - Title (RemindAR) */}
                            <div
                                ref={leftTextRef}
                                className="absolute left-0 top-1/2 flex flex-col z-40"
                                style={{
                                    transform: 'translateY(-50%) scale(0.79)',
                                    transformOrigin: 'left center',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <span
                                    className="italic text-base sm:text-lg md:text-xl lg:text-2xl"
                                    style={{ fontFamily: 'Mileast', color: '#9E6B30' }}
                                >
                                    THIS IS
                                </span>
                                <h1
                                    className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] tracking-wide whitespace-nowrap -mt-2"
                                    style={{
                                        fontFamily: 'Transcity',
                                        background: 'linear-gradient(180deg, #9E7B30 0%, #D8B64E 30%, #E8C85E 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.5))'
                                    }}
                                >
                                    RemindAR
                                </h1>
                            </div>

                            <div
                                ref={frameContainerRef}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: isMobile
                                        ? 'translate(-50%, -42%) scale(1.8) rotate(90deg)'
                                        : 'translate(-50%, -42%) scale(2.42)',
                                    zIndex: 10,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <img
                                    ref={frameRef}
                                    src="/framee.png"
                                    alt="Ornate frame"
                                />
                            </div>

                            {/* Content inside frame (visible and scaled down to fit initially) */}
                            <div
                                ref={contentRef}
                                className="absolute inset-0 flex items-center justify-center z-30"
                                style={{
                                    transform: isMobile ? 'scale(0.35) rotate(90deg)' : 'scale(0.45)',
                                    opacity: 1,
                                    transformOrigin: 'center center'
                                }}
                            >
                                {/* This is the content that zooms in */}
                                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                                    {/* Solid background layer to cover any texture */}
                                    <div
                                        className="rounded-lg relative overflow-hidden"
                                        style={{ backgroundColor: '#F5F0E8' }}
                                    >
                                        {/* Fully opaque inner container - PLAIN SOLID BACKGROUND */}
                                        <div
                                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-8 relative"
                                            style={{ backgroundColor: '#F5F0E8' }}
                                        >
                                            {/* Line Grid Background from public folder - FILLS ENTIRE SCREEN */}
                                            <div
                                                className="fixed inset-0 pointer-events-none flex items-center justify-center"
                                                style={{ zIndex: 0 }}
                                            >
                                                <img
                                                    src="/Line_Grid.svg"
                                                    alt=""
                                                    className="w-screen h-screen object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                                    style={{ opacity: 0.5, minWidth: '100vw', minHeight: '100vh' }}
                                                />
                                            </div>

                                            {/* Left Column - Text Content */}
                                            <div className="space-y-6 md:space-y-8 relative z-10">
                                                <h2
                                                    ref={contentTextRef}
                                                    className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-tight"
                                                    style={{ fontFamily: 'Moglan_DEMO', color: '#272728' }}
                                                >
                                                    <span className="underline decoration-2 underline-offset-4" style={{ textDecorationColor: '#272728' }}>RemindAR</span>{typedText.slice(8)}{!isTypingComplete && <span className="animate-pulse">|</span>}
                                                </h2>

                                                <button
                                                    ref={tryDemoButtonRef}
                                                    onClick={onStartDemo}
                                                    className="bg-remindar-button-brown text-remindar-button-text text-sm md:text-base px-6 py-3 hover:brightness-110 transition-all duration-300"
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
                                                                    gsap.to(el, {
                                                                        opacity: 0.7,
                                                                        y: 0,
                                                                        duration: 0.5,
                                                                        delay: 0.3,
                                                                        ease: 'power2.out'
                                                                    });
                                                                },
                                                                once: true
                                                            });
                                                        }
                                                    }}
                                                >
                                                    (camera and mic required)
                                                </p>
                                            </div>

                                            {/* Right Column - Screenshot */}
                                            <div className="relative z-10">
                                                <img
                                                    src="/screenshot_first.png"
                                                    alt="Web demo preview"
                                                    className="w-full h-auto"
                                                />
                                                <p
                                                    className="text-black italic text-[9px] sm:text-xs mt-2 text-center"
                                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                                >
                                                    (Web demo preview)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Text */}
                            <div
                                ref={rightTextRef}
                                className="absolute right-0 top-1/2 text-right z-20"
                                style={{ transform: 'translateY(-50%) scale(1.3)', transformOrigin: 'right center' }}
                            >
                                <p
                                    className="text-white text-sm sm:text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    For the faces you'd have<br />
                                    framed if you hadn't<br />
                                    forgotten.
                                </p>
                            </div>
                        </div>

                        {/* Bottom Text */}
                        <div className="pb-4 md:pb-8">
                            <p
                                ref={bottomTextRef}
                                className="text-white text-center text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                                style={{ fontFamily: 'HelveticaNeue-UltraLight', transform: 'scale(1.5)' }}
                            >
                                Gemini powered assistant that helps people with memory challenges recognize loved ones and recall meaningful context.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Features Section */}
            <section
                ref={featuresSectionRef}
                className="relative w-full py-12 md:py-16 lg:py-20 min-h-screen"
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
                            className={`mb-8 md:mb-0 relative z-20 ${isMobile ? 'w-[320px] h-[220px]' : 'w-[500px] h-[350px] md:w-[700px] md:h-[500px]'}`}
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

                    {/* Powered by Gemini Section - Full page */}
                    <div
                        ref={geminiSectionRef}
                        className="min-h-screen flex flex-col justify-center py-20"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto px-4">
                            {/* Feature 1 */}
                            <div ref={geminiFeature1Ref} className="space-y-2">
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
                            <div ref={geminiFeature2Ref} className="space-y-2">
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
                            <div ref={geminiFeature3Ref} className="space-y-2">
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
                            <div ref={geminiFeature4Ref} className="space-y-2">
                                <h3
                                    className="text-xl md:text-2xl text-black font-bold"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Multi-Language Processing
                                </h3>
                                <p
                                    className="text-black text-base md:text-lg"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    Handles English, Hindi, Hinglish seamlessly.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notable Features List */}
                    <div className="mb-32 md:mb-40 mt-32 md:mt-48">
                        <h4
                            className="text-black text-sm tracking-wider mb-6"
                            style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                        >
                            [Notable Features]
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
                            {/* Left Column - Features with Video */}
                            <div className="space-y-6">
                                {/* Hover Feature with Video */}
                                <div className="border-b border-black pb-4">
                                    <p className="text-black font-helvetica font-bold text-xs sm:text-sm mb-3">
                                        Interactive Face Labels Hover to reveal info and actions.
                                    </p>
                                    <video
                                        src="/1768670517690173.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-auto rounded-lg"
                                    />
                                    <p
                                        className="text-black italic text-[9px] sm:text-xs mt-2"
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
                                    <img
                                        src="/screenshot_bottom.png"
                                        alt="Dashboard view"
                                        className="w-full h-auto rounded-lg"
                                    />
                                    <p
                                        className="text-black italic text-[9px] sm:text-xs mt-2"
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
            </section>

            {/* Footer Section */}
            <footer className="w-full bg-remindar-brown py-12 md:py-16">
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
                                className="text-white/80 text-sm"
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
                                    <button onClick={onStartDemo} className="text-white/70 text-sm hover:text-white transition-colors text-left w-full" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
                                        Try Demo
                                    </button>
                                </li>
                                <li>
                                    <a href="#" className="text-white/70 text-sm hover:text-white transition-colors" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-white/70 text-sm hover:text-white transition-colors" style={{ fontFamily: 'HelveticaNeue-UltraLight' }}>
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
                                    className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors"
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
                                    className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors"
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
                            className="text-white/50 text-xs text-center"
                            style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                        >
                            © 2026 RemindAR. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
