import React from 'react';
import type { ParsedEvent } from '../utils/analytics';
import { calculateSummaryStats } from '../utils/analytics';

export default function SummaryCards({ events }: { events: ParsedEvent[] }) {
    const stats = React.useMemo(() => calculateSummaryStats(events), [events]);

    return (
        <div className="summary-cards">
            <div className="card summary-card">
                <h3>Total Sessions</h3>
                <div className="value">{stats.totalSessions}</div>
            </div>
            <div className="card summary-card">
                <h3>Avg Direct Duration</h3>
                <div className="value">{stats.avgSessionDuration}</div>
            </div>
            <div className="card summary-card">
                <h3>Total Page Views</h3>
                <div className="value">{stats.totalPageViews}</div>
            </div>
            <div className="card summary-card">
                <h3>Total Events</h3>
                <div className="value">{stats.totalEvents.toLocaleString()}</div>
            </div>
        </div>
    );
}
