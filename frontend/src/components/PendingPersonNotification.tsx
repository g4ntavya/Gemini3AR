/**
 * Pending Person Notification - macOS-style slide-in notification
 * Shows when an unknown person has been visible for 3+ minutes
 * 
 * Design: X button top-left to dismiss (No), circular avatar,
 * title + message, Yes/Later buttons at bottom
 */

interface PendingPerson {
    trackId: string;
    faceImage: string;
    firstSeen: number;
    duration: number;  // in seconds
    expiresAt: number; // timestamp when this pending entry expires (2 hours after "Later")
}

interface PendingPersonNotificationProps {
    person: PendingPerson | null;
    onYes: (person: PendingPerson) => void;
    onNo: (person: PendingPerson) => void;
    onLater: (person: PendingPerson) => void;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return 'less than a minute';
    if (mins === 1) return '1 minute';
    return `${mins} minutes`;
}

export function PendingPersonNotification({ 
    person, 
    onYes, 
    onNo, 
    onLater 
}: PendingPersonNotificationProps) {
    if (!person) return null;

    return (
        <div className="macos-notification">
            {/* X button - top left corner (dismiss/No) */}
            <button 
                className="macos-notification-close"
                onClick={() => onNo(person)}
                title="Dismiss"
            >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                    <path d="M1.41 0L0 1.41L2.59 4L0 6.59L1.41 8L4 5.41L6.59 8L8 6.59L5.41 4L8 1.41L6.59 0L4 2.59L1.41 0Z" />
                </svg>
            </button>

            {/* Main content area */}
            <div className="macos-notification-body">
                {/* Circular avatar */}
                <div className="macos-notification-avatar">
                    {person.faceImage ? (
                        <img src={person.faceImage} alt="Unknown person" />
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                    )}
                </div>

                {/* Text content */}
                <div className="macos-notification-text">
                    <div className="macos-notification-title">New Person Detected</div>
                    <div className="macos-notification-message">
                        You've been talking for {formatDuration(person.duration)}. Save this person?
                    </div>
                </div>
            </div>

            {/* Action buttons at bottom */}
            <div className="macos-notification-actions">
                <button 
                    className="macos-notification-btn later"
                    onClick={() => onLater(person)}
                >
                    Later
                </button>
                <button 
                    className="macos-notification-btn yes"
                    onClick={() => onYes(person)}
                >
                    Yes
                </button>
            </div>
        </div>
    );
}

export type { PendingPerson };
