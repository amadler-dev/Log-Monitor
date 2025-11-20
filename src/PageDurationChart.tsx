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
    Brush,
} from "recharts";

export default function PageDurationChart({ events }: { events: ParsedEvent[] }) {
    const aggregated = React.useMemo(() => {
        const map = new Map<string, number>();
        for (const e of events) {
            if (e.type === 'page_view' && e.duration && e.duration > 0) {
                const key = e.url || "unknown";
                map.set(key, (map.get(key) ?? 0) + e.duration);
            }
        }

        return Array.from(map.entries())
            .map(([url, duration]) => ({ url, duration: Math.round(duration / 60 * 10) / 10 })) // minutes
            .sort((a, b) => b.duration - a.duration);
    }, [events]);

    if (!events.length) return null;

    return (
        <div style={{ width: "100%", height: 400, marginTop: 20 }}>
            <h3>Time per Page (Minutes)</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={aggregated} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="url" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="duration" name="Duration (min)" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
