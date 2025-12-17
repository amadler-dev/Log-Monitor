import React from "react";
import type { ParsedEvent } from "./utils/analytics";
import { getDeviceStats } from "./utils/analytics";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DeviceChart({ events }: { events: ParsedEvent[] }) {
    const { browserData, osData } = React.useMemo(() => getDeviceStats(events), [events]);

    if (!events.length) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ height: 300 }}>
                <h4 style={{ textAlign: 'center', marginBottom: 10 }}>Browser Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={browserData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {browserData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div style={{ height: 300 }}>
                <h4 style={{ textAlign: 'center', marginBottom: 10 }}>OS Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={osData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#82ca9d"
                            dataKey="value"
                        >
                            {osData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
