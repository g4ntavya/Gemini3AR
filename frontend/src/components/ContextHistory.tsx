/**
 * Context History Component - Shows timeline of changes for a person
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

// Format date for display
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

// Format time for display
function formatTime(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '';
    }
}

// Group history entries by date
function groupByDate(history: PersonHistoryEntry[]): Map<string, PersonHistoryEntry[]> {
    const groups = new Map<string, PersonHistoryEntry[]>();
    
    for (const entry of history) {
        const dateKey = formatDate(entry.changed_at);
        const existing = groups.get(dateKey) || [];
        existing.push(entry);
        groups.set(dateKey, existing);
    }
    
    return groups;
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

    const groupedHistory = groupByDate(history);

    return (
        <div className="history-timeline">
            {Array.from(groupedHistory.entries()).map(([date, entries]) => (
                <div key={date} className="history-group">
                    <div className="history-date">
                        <span className="history-date-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </span>
                        {date}
                    </div>
                    
                    {entries.map((entry) => (
                        <div key={entry.id} className="history-entry">
                            <div className="history-field">
                                {formatFieldName(entry.field_changed)}
                            </div>
                            <div className="history-change">
                                {entry.old_value && (
                                    <>
                                        <span className="history-old">{entry.old_value}</span>
                                        <span className="history-arrow">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12,5 19,12 12,19" />
                                            </svg>
                                        </span>
                                    </>
                                )}
                                <span className="history-new">{entry.new_value}</span>
                            </div>
                            <div className="history-time">
                                {formatTime(entry.changed_at)}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
