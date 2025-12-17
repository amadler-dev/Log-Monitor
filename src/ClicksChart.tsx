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
    const aggregated = React.useMemo(() => {
        const map = new Map<string, number>();
        for (const e of events) {
            if (e.type === 'click') {
                const label = (e.elementText && e.elementText.trim().length > 0)
                    ? e.elementText.slice(0, 30) + (e.elementText.length > 30 ? "..." : "")
                    : (e.elementId || "unknown");
                map.set(label, (map.get(label) ?? 0) + 1);
            }
        }

        return Array.from(map.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);
    }, [events]);

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
            <h3>Clicks by Element</h3>
            <div style={{ width: "100%", height: dynamicHeight }}>
                <ResponsiveContainer width="100%" height="100%">
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
    );
}
