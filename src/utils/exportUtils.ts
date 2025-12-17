import { utils, writeFile } from 'xlsx';
import type { ParsedEvent } from './analytics';
import {
    calculateSummaryStats,
    groupByPeriod,
    getDeviceStats,
    getResolutionStats,
    calculateEngagementStats
} from './analytics';

export type ExportOptions = {
    summary: boolean;
    timeline: boolean;
    sessions: boolean;
    pageTimes: boolean;
    clicks: boolean;
    device: boolean;
    engagement: boolean;
};

export function generateExcel(events: ParsedEvent[], options: ExportOptions) {
    const wb = utils.book_new();

    // 1. Summary
    if (options.summary) {
        const stats = calculateSummaryStats(events);
        const data = [
            ["Metric", "Value"],
            ["Total Sessions", stats.totalSessions],
            ["Avg Duration", stats.avgSessionDuration],
            ["Page Views", stats.totalPageViews],
            ["Total Events", stats.totalEvents],
        ];
        const ws = utils.aoa_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Summary");
    }

    // 2. Timeline Activity (Daily)
    if (options.timeline) {
        const rows = groupByPeriod(events, "day");
        // Simplify for excel
        const data = rows.map(r => ({
            Date: r.label,
            PageViews: r.page_view,
            Clicks: r.click,
            Sessions: r.session
        }));
        const ws = utils.json_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Timeline");
    }

    // 3. Page Times
    if (options.pageTimes) {
        const map = new Map<string, number>();
        for (const e of events) {
            if (e.type === 'page_view' && e.duration && e.duration > 0) {
                const key = e.url || "unknown";
                map.set(key, (map.get(key) ?? 0) + e.duration);
            }
        }
        const data = Array.from(map.entries())
            .map(([Url, DurationSeconds]) => ({ Url, DurationSeconds: Math.round(DurationSeconds) }))
            .sort((a, b) => b.DurationSeconds - a.DurationSeconds);

        const ws = utils.json_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Page Times");
    }

    // 4. Clicks
    if (options.clicks) {
        const map = new Map<string, number>();
        for (const e of events) {
            if (e.type === 'click') {
                const label = e.elementText || e.elementId || "unknown";
                map.set(label, (map.get(label) ?? 0) + 1);
            }
        }
        const data = Array.from(map.entries())
            .map(([Element, Count]) => ({ Element, Count }))
            .sort((a, b) => b.Count - a.Count);

        const ws = utils.json_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Clicks");
    }

    // 5. Device & Screen
    if (options.device) {
        const { browserData, osData } = getDeviceStats(events);
        const resStats = getResolutionStats(events);

        // We can put these in one sheet or separate
        const ws = utils.aoa_to_sheet([["--- Browsers ---"]]);
        utils.sheet_add_json(ws, browserData, { origin: "A2" });

        utils.sheet_add_aoa(ws, [["--- OS ---"]], { origin: "D1" });
        utils.sheet_add_json(ws, osData, { origin: "D2" });

        utils.sheet_add_aoa(ws, [["--- Resolutions ---"]], { origin: "G1" });
        utils.sheet_add_json(ws, resStats, { origin: "G2" });

        utils.book_append_sheet(wb, ws, "System Stats");
        utils.book_append_sheet(wb, ws, "System Stats");
    }

    // 6. Engagement
    if (options.engagement) {
        const stats = calculateEngagementStats(events);
        const data = [
            ["Metric", "Value"],
            ["Total Switches (Tab/Hidden)", stats.totalSwitches],
            ["Total Background Time", stats.totalBackgroundTime + "s"],
            ["Estimated Active Time", stats.activeTime + "s"],
            ["Total Session Time", stats.totalSessionTime + "s"]
        ];
        const ws = utils.aoa_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Engagement");
    }

    writeFile(wb, "Analytics_Report.xlsx");
}
