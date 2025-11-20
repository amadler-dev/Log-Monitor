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

type Period = "day" | "week";

function floorToDayUTC(t: number) {
    const d = new Date(t);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
}

function floorToWeekUTC(t: number) {
    const d = new Date(t);
    const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (isoDay - 1));
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
}

function labelForPeriod(ts: number, period: Period) {
    const d = new Date(ts);
    return d.toISOString().slice(0, 10);
}

export default function SessionChart({ events }: { events: ParsedEvent[] }) {
    const [period, setPeriod] = React.useState<Period>("day");

    const aggregated = React.useMemo(() => {
        const map = new Map<number, { count: number; totalDuration: number }>();
        const floor = period === "week" ? floorToWeekUTC : floorToDayUTC;

        for (const e of events) {
            if (e.type === 'session_end' && e.duration) {
                const k = floor(e.ts);
                const entry = map.get(k) ?? { count: 0, totalDuration: 0 };
                entry.count += 1;
                entry.totalDuration += e.duration;
                map.set(k, entry);
            }
        }

        return Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([ts, val]) => ({
                ts,
                label: labelForPeriod(ts, period),
                count: val.count,
                avgDuration: val.count ? Math.round(val.totalDuration / val.count / 60 * 10) / 10 : 0 // minutes
            }));
    }, [events, period]);

    if (!events.length) return null;

    return (
        <div style={{ width: "100%", height: 400, marginTop: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <h3>Session Statistics</h3>
                <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                </select>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={aggregated} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Session Count" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="avgDuration" name="Avg Duration (min)" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
