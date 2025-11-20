import React from "react";
import type { ParsedEvent } from "./Import";
import {
    ResponsiveContainer,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Bar,
    Legend,
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
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 clicks
    }, [events]);

    if (!events.length) return null;

    return (
        <div style={{ width: "100%", height: 400, marginTop: 20 }}>
            <h3>Top Clicks by Element</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={aggregated} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Click Count" fill="#ffc658" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
