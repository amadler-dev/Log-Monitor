export type ParsedEvent = {
    time: string;
    ts: number;
    type: 'click' | 'page_view' | 'session_start' | 'session_end';
    url: string;
    page?: string;
    duration?: number;
    elementId?: string;
    elementText?: string;
    userAgent?: string;
    screenResolution?: string;
    source?: string;
};

export type Period = "hour" | "day" | "week" | "month";

const MS = {
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    week: 1000 * 60 * 60 * 24 * 7,
};

export function floorToHourUTC(t: number) {
    const d = new Date(t);
    d.setUTCMinutes(0, 0, 0);
    return d.getTime();
}

export function floorToDayUTC(t: number) {
    const d = new Date(t);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
}

export function floorToWeekUTC(t: number) {
    const d = new Date(t);
    const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (isoDay - 1));
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
}

export function floorToMonthUTC(t: number) {
    const d = new Date(t);
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
}

export function labelForPeriod(ts: number, period: Period) {
    const d = new Date(ts);
    if (period === "week") {
        return d.toISOString().slice(0, 10);
    }
    if (period === "month") {
        return d.toISOString().slice(0, 7);
    }
    if (period === "hour") {
        return d.toISOString().slice(0, 13).replace("T", " ") + ":00Z";
    }
    return d.toISOString().slice(0, 10);
}

export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    return `${hours}h ${remMin}m`;
}

export function groupByPeriod(events: ParsedEvent[], period: Period) {
    const map = new Map<number, { page_view: number; click: number; session: number; other: number }>();
    const floor =
        period === "hour"
            ? floorToHourUTC
            : period === "week"
                ? floorToWeekUTC
                : period === "month"
                    ? floorToMonthUTC
                    : floorToDayUTC;

    for (const e of events) {
        const k = floor(e.ts);
        const entry = map.get(k) ?? { page_view: 0, click: 0, session: 0, other: 0 };

        if (e.type === 'page_view') entry.page_view += 1;
        else if (e.type === 'click') entry.click += 1;
        else if (e.type === 'session_start') entry.session += 1;
        else entry.other += 1;

        map.set(k, entry);
    }

    if (events.length === 0) return [];
    const keys = Array.from(map.keys()).sort((a, b) => a - b);
    const min = keys[0];
    const max = keys[keys.length - 1];
    const step = period === "hour" ? MS.hour : period === "week" ? MS.week : period === "month" ? undefined : MS.day;
    const rows: { ts: number; label: string; page_view: number; click: number; session: number; other: number }[] = [];

    if (period === "month") {
        let cur = floorToMonthUTC(min);
        const end = floorToMonthUTC(max);
        while (cur <= end) {
            const v = map.get(cur) ?? { page_view: 0, click: 0, session: 0, other: 0 };
            rows.push({ ts: cur, label: labelForPeriod(cur, "month"), page_view: v.page_view, click: v.click, session: v.session, other: v.other });
            const d = new Date(cur);
            d.setUTCMonth(d.getUTCMonth() + 1);
            cur = d.getTime();
            if (rows.length > 1000) break;
        }
    } else {
        let cur = floor(min);
        const end = floor(max);
        while (cur <= end) {
            const v = map.get(cur) ?? { page_view: 0, click: 0, session: 0, other: 0 };
            rows.push({ ts: cur, label: labelForPeriod(cur, period), page_view: v.page_view, click: v.click, session: v.session, other: v.other });
            cur = (step ?? MS.day) + cur;
            if (rows.length > 5000) break;
        }
    }

    return rows;
}

export function calculateSummaryStats(events: ParsedEvent[]) {
    const sessions = events.filter(e => e.type === 'session_start');
    const sessionEnds = events.filter(e => e.type === 'session_end' && e.duration);

    // Calculate total duration (in seconds)
    // We prefer session_end duration if available, otherwise we try to infer?
    // Actually the log has session_end with duration.
    const totalDuration = sessionEnds.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const avgDuration = sessions.length ? totalDuration / sessions.length : 0;

    const pageViews = events.filter(e => e.type === 'page_view').length;

    return {
        totalSessions: sessions.length,
        avgSessionDuration: formatDuration(avgDuration),
        totalPageViews: pageViews,
        totalEvents: events.length
    };
}

export function parseUserAgent(ua: string) {
    let browser = "Unknown";
    let os = "Unknown";

    // Simple heuristic parser
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return { browser, os };
}

export function getDeviceStats(events: ParsedEvent[]) {
    const browsers = new Map<string, number>();
    const os = new Map<string, number>();

    // Use only unique sessions or unique users? 
    // Usually device stats are per session or per unique visitor. 
    // We don't have user IDs, so let's use session_start events or just all unique userAgents.
    // Let's iterate all events but dedup by userAgent string to avoid weighting active users too heavily?
    // Or just count all session_starts? Let's use session_starts.

    // Fallback: if no sessions, use all events (deduplicated by source maybe?)
    // Let's stick to unique userAgents encountered.
    const uniqueUAs = new Set<string>();

    events.forEach(e => {
        if (e.userAgent && !uniqueUAs.has(e.userAgent)) {
            uniqueUAs.add(e.userAgent);
            const { browser: b, os: o } = parseUserAgent(e.userAgent);
            browsers.set(b, (browsers.get(b) ?? 0) + 1);
            os.set(o, (os.get(o) ?? 0) + 1);
        }
    });

    const browserData = Array.from(browsers.entries()).map(([name, value]) => ({ name, value }));
    const osData = Array.from(os.entries()).map(([name, value]) => ({ name, value }));

    return { browserData, osData };
}

export function getResolutionStats(events: ParsedEvent[]) {
    const resMap = new Map<string, number>();
    // Resolution might change for same user (resize), but usually we care about "Device Capabilities".
    // Let's count occurences in unique sessions.

    const sessions = events.filter(e => e.type === 'session_start');

    sessions.forEach(e => {
        if (e.screenResolution) {
            resMap.set(e.screenResolution, (resMap.get(e.screenResolution) ?? 0) + 1);
        }
    });

    return Array.from(resMap.entries())
        .map(([resolution, count]) => ({ resolution, count }))
        .sort((a, b) => b.count - a.count);
}
