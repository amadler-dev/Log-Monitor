import React from "react";
import type { ParsedEvent } from "./utils/analytics";
import { getResolutionStats } from "./utils/analytics";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList
} from "recharts";

export default function ResolutionChart({ events }: { events: ParsedEvent[] }) {
    const data = React.useMemo(() => getResolutionStats(events), [events]);

    if (!events.length) return null;

    return (
        <div style={{ height: 400, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h3 style={{ textAlign: 'center' }}>Screen Resolutions</h3>
            <div style={{ height: 350, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height={400} debounce={100}>
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="resolution" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Users" fill="#8884d8">
                            <LabelList dataKey="count" position="right" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
