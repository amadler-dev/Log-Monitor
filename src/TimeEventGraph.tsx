import React from "react";
import type { ParsedEvent, Period } from "./utils/analytics";
import { groupByPeriod } from "./utils/analytics";
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

export default function TimeEventGraph({ events }: { events: ParsedEvent[] }) {
  const [period, setPeriod] = React.useState<Period>("day");
  const aggregated = React.useMemo(() => groupByPeriod(events, period), [events, period]);

  if (!events.length) return null;

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <label style={{ fontSize: 13 }}>Group by:</label>
        <select
          id="event-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          style={{ borderRadius: 6, border: '1px solid #ccc', padding: '4px 8px' }}
        >
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
          Showing {aggregated.length} bins
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={aggregated} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid stroke="#eee" vertical={false} />
          <XAxis
            dataKey="label"
            angle={-25}
            textAnchor="end"
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: '#888' }}
            height={50}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            labelStyle={{ fontWeight: 'bold', marginBottom: 5 }}
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar dataKey="page_view" name="Page Views" stackId="a" fill="#4caf50" radius={[2, 2, 0, 0]} />
          <Bar dataKey="click" name="Clicks" stackId="a" fill="#2196f3" radius={[2, 2, 0, 0]} />
          <Bar dataKey="session" name="Sessions" stackId="a" fill="#ff9800" radius={[2, 2, 0, 0]} />
          <Bar dataKey="other" name="Other" stackId="a" fill="#9c27b0" radius={[2, 2, 0, 0]} />
          <Brush dataKey="label" height={30} stroke="#8884d8" travellerWidth={10} tickFormatter={() => ''} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
