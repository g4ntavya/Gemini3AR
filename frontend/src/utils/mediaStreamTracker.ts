/**
 * Global Media Stream Tracker
 * 
 * Tracks ALL active MediaStreams created in the app.
 * Provides a nuclear killAllStreams() function that guarantees
 * every camera/mic stream is stopped, regardless of React lifecycle.
 */

const activeStreams = new Set<MediaStream>();

/**
 * Register a stream for tracking. Call this whenever getUserMedia succeeds.
 */
export function trackStream(stream: MediaStream): void {
    activeStreams.add(stream);
    console.log(`[MediaTracker] Tracking stream (${activeStreams.size} active)`);

    // Auto-remove when all tracks end naturally
    const checkDone = () => {
        if (stream.getTracks().every(t => t.readyState === 'ended')) {
            activeStreams.delete(stream);
            console.log(`[MediaTracker] Stream ended naturally (${activeStreams.size} active)`);
        }
    };
    stream.getTracks().forEach(track => {
        track.addEventListener('ended', checkDone);
    });
}

/**
 * FORCE KILL all tracked streams. Stops every track on every stream.
 * Also queries the DOM for any video/audio elements with srcObject and kills those too.
 */
export function killAllStreams(): void {
    console.log(`[MediaTracker] KILLING ALL STREAMS (${activeStreams.size} tracked)`);

    // 1. Kill all tracked streams
    for (const stream of activeStreams) {
        stream.getTracks().forEach(track => {
            track.stop();
            console.log(`[MediaTracker] Stopped track: ${track.kind} - ${track.label}`);
        });
    }
    activeStreams.clear();

    // 2. Kill any stream attached to any video/audio element in DOM
    document.querySelectorAll('video, audio').forEach(el => {
        const mediaEl = el as HTMLVideoElement | HTMLAudioElement;
        if (mediaEl.srcObject) {
            const stream = mediaEl.srcObject as MediaStream;
            if (stream.getTracks) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`[MediaTracker] Stopped DOM element track: ${track.kind} - ${track.label}`);
                });
            }
            mediaEl.srcObject = null;
        }
        // Pause and reset the element
        mediaEl.pause();
    });

    console.log('[MediaTracker] All streams killed');
}
