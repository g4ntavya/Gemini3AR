/**
 * Context History Component - Shows a chronological log of changes
 */

import { PersonHistoryEntry } from '../types';

interface ContextHistoryProps {
    history: PersonHistoryEntry[];
    currentContext: string;
    isLoading: boolean;
}

// Format field name for display
function formatFieldName(field: string): string {
    const fieldNames: Record<string, string> = {
        name: 'Name',
        relation: 'Relation',
        context: 'Context',
        last_met: 'Last Met',
    };
    return fieldNames[field] || field;
}

// Format date and time for display
function formatDateTime(dateStr: string): { date: string; time: string } {
    try {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }),
        };
    } catch {
        return { date: dateStr, time: '' };
    }
}

export function ContextHistory({ history, currentContext, isLoading }: ContextHistoryProps) {
    if (isLoading) {
        return (
            <div className="history-loading">
                <div className="history-loading-spinner" />
                <span>Loading history...</span>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="history-empty">
                <div className="history-empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                </div>
                <p>No changes recorded yet</p>
                {currentContext && (
                    <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.6 }}>
                        Current: "{currentContext}"
                    </p>
                )}
            </div>
        );
    }

    // Sort by most recent first (should already be sorted, but ensure)
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );

    return (
        <div className="history-list">
            {sortedHistory.map((entry) => {
                const { date, time } = formatDateTime(entry.changed_at);
                return (
                    <div key={entry.id} className="history-item">
                        <div className="history-item-header">
                            <span className="history-item-field">{formatFieldName(entry.field_changed)}</span>
                            <span className="history-item-datetime">
                                {date} at {time}
                            </span>
                        </div>
                        <div className="history-item-value">
                            {entry.new_value || <em className="history-item-empty">Empty</em>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
