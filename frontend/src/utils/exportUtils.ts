import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

export async function generateExcel(events: ParsedEvent[], options: ExportOptions) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Log Monitor';
    wb.created = new Date();

    // 1. Summary
    if (options.summary) {
        const stats = calculateSummaryStats(events);
        const ws = wb.addWorksheet("Summary");
        ws.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
        ];
        ws.addRows([
            { metric: "Total Sessions", value: stats.totalSessions },
            { metric: "Avg Duration", value: stats.avgSessionDuration },
            { metric: "Page Views", value: stats.totalPageViews },
            { metric: "Total Events", value: stats.totalEvents },
        ]);
    }

    // 2. Timeline Activity (Daily)
    if (options.timeline) {
        const rows = groupByPeriod(events, "day");
        const ws = wb.addWorksheet("Timeline");
        ws.columns = [
            { header: 'Date', key: 'label', width: 20 },
            { header: 'PageViews', key: 'page_view', width: 15 },
            { header: 'Clicks', key: 'click', width: 15 },
            { header: 'Sessions', key: 'session', width: 15 },
        ];
        ws.addRows(rows.map(r => ({
            label: r.label,
            page_view: r.page_view,
            click: r.click,
            session: r.session
        })));
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

        const ws = wb.addWorksheet("Page Times");
        ws.columns = [
            { header: 'Url', key: 'Url', width: 50 },
            { header: 'DurationSeconds', key: 'DurationSeconds', width: 20 },
        ];
        ws.addRows(data);
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

        const ws = wb.addWorksheet("Clicks");
        ws.columns = [
            { header: 'Element', key: 'Element', width: 40 },
            { header: 'Count', key: 'Count', width: 15 },
        ];
        ws.addRows(data);
    }

    // 5. Device & Screen
    if (options.device) {
        const { browserData, osData } = getDeviceStats(events);
        const resStats = getResolutionStats(events);

        const ws = wb.addWorksheet("System Stats");

        // ExcelJS doesn't support "origin" like sheet_add_json easily for arbitrary placement without manual row management.
        // We will just stack them or use separate tables.
        // Let's stack them vertically for simplicity, or we can manage rows index.

        let rowIndex = 1;

        // Browsers
        ws.getCell(`A${rowIndex}`).value = "--- Browsers ---";
        ws.getCell(`A${rowIndex}`).font = { bold: true };
        rowIndex++;
        ws.getRow(rowIndex).values = ["Browser", "Count"];
        rowIndex++;
        browserData.forEach((d: any) => {
            ws.getRow(rowIndex).values = [d.name, d.value];
            rowIndex++;
        });
        rowIndex += 2; // Spacer

        // OS
        ws.getCell(`A${rowIndex}`).value = "--- OS ---";
        ws.getCell(`A${rowIndex}`).font = { bold: true };
        rowIndex++;
        ws.getRow(rowIndex).values = ["OS", "Count"];
        rowIndex++;
        osData.forEach((d: any) => {
            ws.getRow(rowIndex).values = [d.name, d.value];
            rowIndex++;
        });
        rowIndex += 2; // Spacer

        // Resolutions
        ws.getCell(`A${rowIndex}`).value = "--- Resolutions ---";
        ws.getCell(`A${rowIndex}`).font = { bold: true };
        rowIndex++;
        ws.getRow(rowIndex).values = ["Resolution", "Count"];
        rowIndex++;
        resStats.forEach((d: any) => {
            ws.getRow(rowIndex).values = [d.name, d.value];
            rowIndex++;
        });
    }

    // 6. Engagement
    if (options.engagement) {
        const stats = calculateEngagementStats(events);
        const ws = wb.addWorksheet("Engagement");
        ws.columns = [
            { header: 'Metric', key: 'metric', width: 35 },
            { header: 'Value', key: 'value', width: 25 },
        ];
        ws.addRows([
            { metric: "Total Switches (Tab/Hidden)", value: stats.totalSwitches },
            { metric: "Total Background Time", value: stats.totalBackgroundTime + "s" },
            { metric: "Estimated Active Time", value: stats.activeTime + "s" },
            { metric: "Total Session Time", value: stats.totalSessionTime + "s" }
        ]);
    }

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "Analytics_Report.xlsx");
}
