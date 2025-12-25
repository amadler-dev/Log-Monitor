import React from "react";
import type { ParsedEvent, Period } from "./utils/analytics";
import { floorToDayUTC, floorToWeekUTC, labelForPeriod } from "./utils/analytics";
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

export default function SessionChart({ events }: { events: ParsedEvent[] }) {
    // We only want day/week for this chart, casting is fine or we can limit the UI
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
        <div style={{ width: "100%", height: 400 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <h3>Session Statistics</h3>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                </select>
            </div>
            <ResponsiveContainer width="100%" height={400} minWidth={0} minHeight={0} debounce={100}>
                <BarChart data={aggregated} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Session Count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avgDuration" name="Avg Duration (min)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
