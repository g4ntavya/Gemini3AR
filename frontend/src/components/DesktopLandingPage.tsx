import { useEffect, useRef, useState, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import GlassesModel, { GlassesModelHandle } from './GlassesModel';
import SplitText from './SplitText';
import { RegionSelector } from './RegionSelector';
import type { User } from 'firebase/auth';
import type { Region } from '../data/regions';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

interface LandingPageProps {
    onStartDemo: () => void;
    user: User | null;
    onSignIn: () => void;
    onLogout: () => void;
    region: Region | undefined;
    allRegions: Region[];
    onRegionChange: (code: string) => void;
}

export function LandingPage({ onStartDemo, user, onSignIn, onLogout, region, allRegions, onRegionChange }: LandingPageProps) {
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
    const tryDemoButtonRef = useRef<HTMLDivElement>(null);

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

    const typingSpanRef = useRef<HTMLSpanElement>(null);
    const cursorRef = useRef<HTMLSpanElement>(null);
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

    // Parallax state — rAF lerp loop (zero tweens, zero allocations per mouse event)
    const parallaxMouse = useRef({ x: 0, y: 0 });
    const parallaxRaf = useRef(0);

    useEffect(() => {
        const hero = heroRef.current;
        const wrapper = wrapperRef.current;
        const content = contentRef.current;
        const innerContent = innerContentRef.current;
        const bgContainer = bgContainerRef.current;
        const leftText = leftTextRef.current;
        const frameContainer = frameContainerRef.current;

        if (!hero || !wrapper || !content || !leftText || !frameContainer || !bgContainer) return;

        // Mouse parallax — rAF lerp loop: mousemove only stores target, rAF smoothly interpolates
        if (!isMobile) {
            const layers = [
                { el: bgRef.current!,        mx: 10, my: 10, cx: 0, cy: 0, ease: 0.08 },
                { el: frameRef.current!,      mx: 8,  my: 5,  cx: 0, cy: 0, ease: 0.08 },
                { el: bgContainer,            mx: 8,  my: 5,  cx: 0, cy: 0, ease: 0.08 },
                { el: rightTextRef.current!,  mx: 20, my: 15, cx: 0, cy: 0, ease: 0.12 },
                { el: bottomTextRef.current!, mx: 20, my: 15, cx: 0, cy: 0, ease: 0.12 },
                { el: leftTextRef.current!,   mx: 60, my: 40, cx: 0, cy: 0, ease: 0.15 },
            ].filter(l => l.el);

            const mouse = parallaxMouse.current;

            const tick = () => {
                for (const layer of layers) {
                    const tx = mouse.x * layer.mx;
                    const ty = mouse.y * layer.my;
                    layer.cx += (tx - layer.cx) * layer.ease;
                    layer.cy += (ty - layer.cy) * layer.ease;
                    gsap.set(layer.el, { x: layer.cx, y: layer.cy, force3D: true });
                }
                parallaxRaf.current = requestAnimationFrame(tick);
            };
            parallaxRaf.current = requestAnimationFrame(tick);

            const handleMouseMove = (e: MouseEvent) => {
                mouse.x = (e.clientX / window.innerWidth) - 0.5;
                mouse.y = (e.clientY / window.innerHeight) - 0.5;
            };

            hero.addEventListener('mousemove', handleMouseMove);
            (hero as any)._parallaxHandler = handleMouseMove;
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
            cancelAnimationFrame(parallaxRaf.current);
            if ((hero as any)._parallaxHandler) {
                hero.removeEventListener('mousemove', (hero as any)._parallaxHandler);
                delete (hero as any)._parallaxHandler;
            }
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [isMobile]); // Re-run animation setup when mobile state changes

    // Typing effect — direct DOM mutation, zero React re-renders
    useEffect(() => {
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                if (typingSpanRef.current) {
                    typingSpanRef.current.textContent = fullText.slice(8, currentIndex);
                }
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                if (cursorRef.current) cursorRef.current.style.display = 'none';
            }
        }, 25);

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
            if (currentHero && (currentHero as any)._parallaxHandler) {
                currentHero.removeEventListener('mousemove', (currentHero as any)._parallaxHandler);
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
                                                    <span className="underline decoration-1 underline-offset-2" style={{ textDecorationColor: '#272728' }}>RemindAR</span><span ref={typingSpanRef}></span><span ref={cursorRef} className="animate-pulse">|</span>
                                                </h2>

                                                {/* Auth Buttons - Sign In + Try Demo */}
                                                <div
                                                    ref={tryDemoButtonRef}
                                                    className={`flex flex-wrap items-center gap-2 sm:gap-3 ${isMobile ? 'justify-center' : 'justify-start'}`}
                                                    style={{ opacity: 0 }}
                                                >
                                                    {!user && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); onSignIn(); }}
                                                            onTouchEnd={(e) => { e.preventDefault(); onSignIn(); }}
                                                            className="bg-remindar-button-brown text-remindar-button-text text-[10px] sm:text-sm md:text-base px-4 py-2 md:px-6 md:py-3 hover:brightness-110 transition-all duration-300 relative z-50 cursor-pointer flex items-center justify-center gap-1.5 md:gap-2"
                                                            style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                                        >
                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                            </svg>
                                                            Sign In
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); if (user) onStartDemo(); }}
                                                        onTouchEnd={(e) => { e.preventDefault(); if (user) onStartDemo(); }}
                                                        className={`flex-shrink-0 text-[10px] sm:text-sm md:text-base px-4 py-2 md:px-6 md:py-3 transition-all duration-300 relative z-50 ${
                                                            user
                                                                ? 'bg-remindar-button-brown text-remindar-button-text hover:brightness-110 cursor-pointer'
                                                                : 'bg-gray-400 text-gray-300 cursor-not-allowed'
                                                        }`}
                                                        style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                                    >
                                                        Try Demo
                                                    </button>
                                                    {user && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); onLogout(); }}
                                                            onTouchEnd={(e) => { e.preventDefault(); onLogout(); }}
                                                            className="text-[10px] sm:text-sm md:text-base px-4 md:px-6 h-[31px] sm:h-9 md:h-12 border border-black/20 text-black/60 hover:bg-remindar-button-brown hover:text-remindar-button-text hover:border-remindar-button-brown transition-all duration-300 relative z-50 cursor-pointer flex items-center justify-center"
                                                            style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                                        >
                                                            Log Out
                                                        </button>
                                                    )}
                                                    {/* Region Selector - only visible after signing in */}
                                                    {user && (
                                                        <RegionSelector
                                                            currentRegion={region}
                                                            regions={allRegions}
                                                            onSelect={onRegionChange}
                                                        />
                                                    )}
                                                </div>
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
                                ? { bottom: 'calc(18.5% - 15px)', left: '50%', transform: 'translateX(-50%)', transformOrigin: 'center center', textAlign: 'center' as const, width: '90%' }
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
                    <div className="absolute left-0 right-0 z-20 text-center pointer-events-none" style={{ bottom: isMobile ? '9.5%' : '7rem', padding: isMobile ? '0 1rem' : '0 2rem' }}>
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

                    {/* Scroll Down Indicator */}
                    {!isMobile && (
                        <div
                            ref={(el) => {
                                if (el && wrapperRef.current) {
                                    gsap.to(el, {
                                        opacity: 0,
                                        scrollTrigger: {
                                            trigger: wrapperRef.current,
                                            start: 'top top',
                                            end: '+=5%', // Fade out almost instantly on scroll
                                            scrub: true,
                                        }
                                    });
                                }
                            }}
                            className="absolute inset-x-0 mx-auto w-fit z-30 opacity-40 transition-opacity duration-500 pointer-events-none"
                            style={{ bottom: isMobile ? '10%' : '1rem' }}
                        >
                            <svg className="animate-bounce" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 9l8 8 8-8" />
                            </svg>
                        </div>
                    )}
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
                            <Canvas camera={{ position: [0, 0, 5], fov: 50 }} frameloop="demand">
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

            {/* How It Works Section */}
            <section
                className="relative w-full py-24 md:py-32"
                style={{ backgroundColor: '#F5F0E8' }}
            >
                {/* Grid Line Background */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.08, zIndex: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="how-it-works-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#272728" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#how-it-works-grid)" />
                </svg>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div className="text-center mb-16 md:mb-24">
                        <h2
                            className="text-4xl sm:text-5xl md:text-6xl text-black mb-6"
                            style={{ fontFamily: 'Moglan_DEMO' }}
                        >
                            How It Works
                        </h2>
                        <p
                            className="text-black/80 text-lg md:text-xl max-w-2xl mx-auto"
                            style={{ fontFamily: 'HelveticaNeue-Light' }}
                        >
                            Three simple steps to never forget a face again
                        </p>
                    </div>

                    {/* Steps Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 max-w-6xl mx-auto">
                        {/* Step 1 */}
                        <div 
                            className="group relative bg-white/50 backdrop-blur-sm border border-black/10 p-8 md:p-10 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, y: 40 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <span 
                                    className="text-5xl md:text-6xl text-remindar-button-brown/30 group-hover:text-remindar-button-brown transition-colors duration-300"
                                    style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                >
                                    01
                                </span>
                                <div className="w-12 h-[1px] bg-black/20 group-hover:w-20 group-hover:bg-remindar-button-brown transition-all duration-300"></div>
                            </div>
                            <h3
                                className="text-xl md:text-2xl text-black mb-4"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                See Someone
                            </h3>
                            <p
                                className="text-black/80 text-base md:text-lg leading-relaxed"
                                style={{ fontFamily: 'HelveticaNeue-Light' }}
                            >
                                Point your camera at anyone. RemindAR instantly detects faces in your field of view using advanced on-device processing.
                            </p>
                            {/* Icon */}
                            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div 
                            className="group relative bg-white/50 backdrop-blur-sm border border-black/10 p-8 md:p-10 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, y: 40 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: 0.15, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <span 
                                    className="text-5xl md:text-6xl text-remindar-button-brown/30 group-hover:text-remindar-button-brown transition-colors duration-300"
                                    style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                >
                                    02
                                </span>
                                <div className="w-12 h-[1px] bg-black/20 group-hover:w-20 group-hover:bg-remindar-button-brown transition-all duration-300"></div>
                            </div>
                            <h3
                                className="text-xl md:text-2xl text-black mb-4"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                Get Context
                            </h3>
                            <p
                                className="text-black/80 text-base md:text-lg leading-relaxed"
                                style={{ fontFamily: 'HelveticaNeue-Light' }}
                            >
                                If recognized, their name, relationship, and your last conversation appear instantly.
                            </p>
                            {/* Icon */}
                            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div 
                            className="group relative bg-white/50 backdrop-blur-sm border border-black/10 p-8 md:p-10 hover:bg-white/80 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, y: 40 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <span 
                                    className="text-5xl md:text-6xl text-remindar-button-brown/30 group-hover:text-remindar-button-brown transition-colors duration-300"
                                    style={{ fontFamily: 'Mileast', fontStyle: 'italic' }}
                                >
                                    03
                                </span>
                                <div className="w-12 h-[1px] bg-black/20 group-hover:w-20 group-hover:bg-remindar-button-brown transition-all duration-300"></div>
                            </div>
                            <h3
                                className="text-xl md:text-2xl text-black mb-4"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                Build Memory
                            </h3>
                            <p
                                className="text-black/80 text-base md:text-lg leading-relaxed"
                                style={{ fontFamily: 'HelveticaNeue-Light' }}
                            >
                                New face? Just speak in your language. Gemini transcribes and extracts name, relationship, and context automatically. RemindAR is inclusive for all 🤍.
                            </p>
                            {/* Icon */}
                            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who It's For Section */}
            <section
                className="relative w-full py-24 md:py-32"
                style={{ backgroundColor: '#F5F0E8' }}
            >
                {/* Grid Line Background */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.06, zIndex: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="who-its-for-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#272728" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#who-its-for-grid)" />
                </svg>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {/* Section Header */}
                    <div className="text-center mb-16 md:mb-20">
                        <h2
                            className="text-4xl sm:text-5xl md:text-6xl text-black mb-6"
                            style={{ fontFamily: 'Moglan_DEMO' }}
                        >
                            Who It's For
                        </h2>
                        <p
                            className="text-black/80 text-lg md:text-xl max-w-2xl mx-auto"
                            style={{ fontFamily: 'HelveticaNeue-Light' }}
                        >
                            Designed with empathy for those who need it most
                        </p>
                    </div>

                    {/* Use Cases Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">
                        {/* Use Case 1 */}
                        <div 
                            className="flex gap-6 items-start"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, x: -30 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex-shrink-0 w-14 h-14 bg-remindar-button-brown/10 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-remindar-button-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3
                                    className="text-xl md:text-2xl text-black mb-2"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Early-Stage Memory Conditions
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Gentle support for those experiencing mild cognitive changes, helping maintain independence and confidence in social situations.
                                </p>
                            </div>
                        </div>

                        {/* Use Case 2 */}
                        <div 
                            className="flex gap-6 items-start"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, x: 30 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, x: 0, duration: 0.6, delay: 0.1, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex-shrink-0 w-14 h-14 bg-remindar-button-brown/10 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-remindar-button-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3
                                    className="text-xl md:text-2xl text-black mb-2"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Face Blindness (Prosopagnosia)
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    A reliable companion for those who struggle to recognize faces, reducing anxiety in everyday encounters.
                                </p>
                            </div>
                        </div>

                        {/* Use Case 3 */}
                        <div 
                            className="flex gap-6 items-start"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, x: -30 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, x: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex-shrink-0 w-14 h-14 bg-remindar-button-brown/10 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-remindar-button-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3
                                    className="text-xl md:text-2xl text-black mb-2"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Busy Professionals
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Network effortlessly at conferences and events. Never forget a client, colleague, or important contact again.
                                </p>
                            </div>
                        </div>

                        {/* Use Case 4 */}
                        <div 
                            className="flex gap-6 items-start"
                            ref={(el) => {
                                if (el) {
                                    gsap.set(el, { opacity: 0, x: 30 });
                                    ScrollTrigger.create({
                                        trigger: el,
                                        start: 'top 90%',
                                        onEnter: () => {
                                            gsap.to(el, { opacity: 1, x: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' });
                                        }
                                    });
                                }
                            }}
                        >
                            <div className="flex-shrink-0 w-14 h-14 bg-remindar-button-brown/10 rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-remindar-button-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <div>
                                <h3
                                    className="text-xl md:text-2xl text-black mb-2"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Caregivers & Families
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Peace of mind for families supporting loved ones. Know they have gentle assistance when needed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gemini & Features Section */}
            <section
                className="relative w-full py-24 md:py-32"
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

                {/* Powered by Gemini Section */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div
                        ref={geminiSectionRef}
                        className="py-12"
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

                        {/* Features Grid - Original Style */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto px-4 mb-32">
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
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
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
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
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
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
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
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Continuous listening with 99% accuracy suitable for long conversations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notable Features - Completely Redesigned */}
                    <div className="mb-16 md:mb-20">
                        <div className="text-center mb-16">
                            <h2
                                className="text-4xl sm:text-5xl md:text-6xl text-black mb-6"
                                style={{ fontFamily: 'Moglan_DEMO' }}
                            >
                                Notable Features
                            </h2>
                            <p
                                className="text-black/80 text-lg md:text-xl max-w-2xl mx-auto"
                                style={{ fontFamily: 'HelveticaNeue-Light' }}
                            >
                                See it in action
                            </p>
                        </div>

                        {/* Feature Showcase - Two Column with Media */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 max-w-6xl mx-auto">
                            {/* Feature 1 - Interactive Face Labels */}
                            <div 
                                className="group"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, y: 30 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 85%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="relative overflow-hidden rounded-xl bg-black/5 border border-black/10 mb-6">
                                    <video
                                        ref={featureVideoRef}
                                        src="/1768670517690173.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-auto"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                                <h3
                                    className="text-2xl md:text-3xl text-black mb-3"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    Interactive Face Labels
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Hover over any recognized face to reveal their name, your relationship, and recent conversation context. Quick actions let you edit or record new information instantly.
                                </p>
                            </div>

                            {/* Feature 2 - People Dashboard */}
                            <div 
                                className="group"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, y: 30 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 85%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, y: 0, duration: 0.6, delay: 0.15, ease: 'power2.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="relative overflow-hidden rounded-xl bg-black/5 border border-black/10 mb-6">
                                    <img
                                        src="/screenshot_bottom.png"
                                        alt="Dashboard view"
                                        className="w-full h-auto"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                                <h3
                                    className="text-2xl md:text-3xl text-black mb-3"
                                    style={{ fontFamily: 'Moglan_DEMO' }}
                                >
                                    People Dashboard
                                </h3>
                                <p
                                    className="text-black/80 text-base md:text-lg leading-relaxed"
                                    style={{ fontFamily: 'HelveticaNeue-Light' }}
                                >
                                    Manage all your contacts in one place with swipeable cards. Edit details, update context, or remove entries with intuitive touch gestures.
                                </p>
                            </div>
                        </div>

                        {/* Technical Features Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto mt-16">
                            {/* Tech Feature 1 */}
                            <div 
                                className="text-center p-6 bg-white/40 rounded-lg border border-black/5 hover:bg-white/70 transition-all duration-300"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, scale: 0.9 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 90%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="w-10 h-10 mx-auto mb-3 text-remindar-button-brown">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <h4 className="text-sm md:text-base font-bold text-black mb-1" style={{ fontFamily: 'Moglan_DEMO' }}>
                                    Cloud Sync
                                </h4>
                                <p className="text-xs md:text-sm text-black/70" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                                    Firebase + SQLite hybrid
                                </p>
                            </div>

                            {/* Tech Feature 2 */}
                            <div 
                                className="text-center p-6 bg-white/40 rounded-lg border border-black/5 hover:bg-white/70 transition-all duration-300"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, scale: 0.9 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 90%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, scale: 1, duration: 0.4, delay: 0.1, ease: 'back.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="w-10 h-10 mx-auto mb-3 text-remindar-button-brown">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm md:text-base font-bold text-black mb-1" style={{ fontFamily: 'Moglan_DEMO' }}>
                                    Mobile Ready
                                </h4>
                                <p className="text-xs md:text-sm text-black/70" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                                    PWA with fullscreen camera
                                </p>
                            </div>

                            {/* Tech Feature 3 */}
                            <div 
                                className="text-center p-6 bg-white/40 rounded-lg border border-black/5 hover:bg-white/70 transition-all duration-300"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, scale: 0.9 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 90%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, scale: 1, duration: 0.4, delay: 0.2, ease: 'back.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="w-10 h-10 mx-auto mb-3 text-remindar-button-brown">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-sm md:text-base font-bold text-black mb-1" style={{ fontFamily: 'Moglan_DEMO' }}>
                                    Real-Time
                                </h4>
                                <p className="text-xs md:text-sm text-black/70" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                                    Instant face detection
                                </p>
                            </div>

                            {/* Tech Feature 4 */}
                            <div 
                                className="text-center p-6 bg-white/40 rounded-lg border border-black/5 hover:bg-white/70 transition-all duration-300"
                                ref={(el) => {
                                    if (el) {
                                        gsap.set(el, { opacity: 0, scale: 0.9 });
                                        ScrollTrigger.create({
                                            trigger: el,
                                            start: 'top 90%',
                                            onEnter: () => {
                                                gsap.to(el, { opacity: 1, scale: 1, duration: 0.4, delay: 0.3, ease: 'back.out' });
                                            }
                                        });
                                    }
                                }}
                            >
                                <div className="w-10 h-10 mx-auto mb-3 text-remindar-button-brown">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                </div>
                                <h4 className="text-sm md:text-base font-bold text-black mb-1" style={{ fontFamily: 'Moglan_DEMO' }}>
                                    Multi-Language
                                </h4>
                                <p className="text-xs md:text-sm text-black/70" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                                    Inclusive for people worldwide
                                </p>
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
                                <a
                                    href="https://x.com/somesh_ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-white text-sm hover:text-gray-300 transition-colors"
                                    style={{ fontFamily: 'HelveticaNeue-UltraLight' }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    @somesh_ai
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
