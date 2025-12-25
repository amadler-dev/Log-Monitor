import React from "react";
import type { ParsedEvent } from "./utils/analytics";
import {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Bar,
    Legend,
    LabelList,
} from "recharts";

export default function ClicksChart({ events }: { events: ParsedEvent[] }) {
    const [selectedUrl, setSelectedUrl] = React.useState<string>("all");

    // Extract unique URLs for the filter dropdown
    const uniqueUrls = React.useMemo(() => {
        const urls = new Set<string>();
        events.forEach(e => {
            if (e.url) urls.add(e.url);
        });
        return Array.from(urls).sort();
    }, [events]);

    const aggregated = React.useMemo(() => {
        const map = new Map<string, number>();
        for (const e of events) {
            if (e.type === 'click') {
                // Filter by URL if a specific one is selected
                if (selectedUrl !== "all" && e.url !== selectedUrl) {
                    continue;
                }

                const label = (e.elementText && e.elementText.trim().length > 0)
                    ? e.elementText.slice(0, 30) + (e.elementText.length > 30 ? "..." : "")
                    : (e.elementId || "unknown");
                map.set(label, (map.get(label) ?? 0) + 1);
            }
        }

        return Array.from(map.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);
    }, [events, selectedUrl]);

    if (!events.length) return null;

    // Expand height dynamically based on number of items, or use a scrollable container?
    // User asked to see ALL click numbers. If there are many, a fixed height might squeeze them.
    // Let's increase the height slightly or make it variable. 
    // For now, I'll keep the height fixed but remove the limit, 
    // but a very long list will look bad in fixed height.
    // Best effort: Increase height if lots of items, but keep it constrained.
    // Actually, let's just make it a bit taller to be safe, 
    // or trust the user knows what they are asking for (might be crowded).
    const dynamicHeight = Math.max(400, aggregated.length * 30);

    return (
        <div style={{ width: "100%", marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3>Clicks by Element</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 14 }}>Filter by Page:</label>
                    <select
                        value={selectedUrl}
                        onChange={(e) => setSelectedUrl(e.target.value)}
                    >
                        <option value="all">All Pages</option>
                        {uniqueUrls.map(url => (
                            <option key={url} value={url}>{url}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div style={{ width: "100%", height: dynamicHeight, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <div style={{ height: dynamicHeight, width: "100%" }}>
                    <ResponsiveContainer width="100%" height={350} debounce={100}>
                        <BarChart data={aggregated} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Click Count" fill="#ffc658">
                                <LabelList dataKey="count" position="right" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
