import React from "react";
import type { ParsedEvent } from "./utils/analytics";
import { calculateEngagementStats, formatDuration } from "./utils/analytics";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts";



export default function EngagementChart({ events }: { events: ParsedEvent[] }) {
    const stats = React.useMemo(() => calculateEngagementStats(events), [events]);

    if (!events.length) return null;

    const data = [
        { name: 'Active Time', value: stats.activeTime },
        { name: 'Background Time', value: stats.totalBackgroundTime },
    ];

    // Filter out zero values to avoid ugly empty pie slices
    const chartData = data.filter(d => d.value > 0);

    return (
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>TOTAL SWITCHES</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.totalSwitches}</div>
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>BACKGROUND TIME</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#FF8042' }}>
                        {formatDuration(stats.totalBackgroundTime)}
                    </div>
                </div>
            </div>

            <div style={{ flex: 2, height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.map((d, index) => (
                                <Cell key={`cell-${index}`} fill={d.name === 'Active Time' ? '#00C49F' : '#FF8042'} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatDuration(value)} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
