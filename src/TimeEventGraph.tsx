// ...existing code...
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

type Period = "hour" | "day" | "week" | "month";

const MS = {
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,
};

function floorToHourUTC(t: number) {
  const d = new Date(t);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}
function floorToDayUTC(t: number) {
  const d = new Date(t);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}
function floorToWeekUTC(t: number) {
  const d = new Date(t);
  // ISO week start Monday
  const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (isoDay - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}
function floorToMonthUTC(t: number) {
  const d = new Date(t);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function labelForPeriod(ts: number, period: Period) {
  const d = new Date(ts);
  if (period === "week") {
    // show iso week start date
    return d.toISOString().slice(0, 10);
  }
  if (period === "month") {
    return d.toISOString().slice(0, 7); // YYYY-MM
  }
  if (period === "hour") {
    return d.toISOString().slice(0, 13).replace("T", " ") + ":00Z"; // YYYY-MM-DD HH:00Z
  }
  // day
  return d.toISOString().slice(0, 10);
}

function groupByPeriod(events: ParsedEvent[], period: Period) {
  const map = new Map<number, { homepage: number; closed: number; other: number }>();
  const floor =
    period === "hour"
      ? floorToHourUTC
      : period === "week"
      ? floorToWeekUTC
      : period === "month"
      ? floorToMonthUTC
      : floorToDayUTC;

  for (const e of events) {
    const k = floor(e.ts);
    const entry = map.get(k) ?? { homepage: 0, closed: 0, other: 0 };
    if (e.homepageLoaded) entry.homepage += 1;
    else if (e.pageClosed) entry.closed += 1;
    else entry.other += 1;
    map.set(k, entry);
  }

  // Ensure contiguous bins between min/max (helps consistent axis ticks)
  if (events.length === 0) return [];
  const keys = Array.from(map.keys()).sort((a, b) => a - b);
  const min = keys[0];
  const max = keys[keys.length - 1];
  const step =
    period === "hour" ? MS.hour : period === "week" ? MS.week : period === "month" ? undefined : MS.day;

  const rows: { ts: number; label: string; homepage: number; closed: number; other: number }[] = [];

  if (period === "month") {
    // iterate months
    let cur = floorToMonthUTC(min);
    const end = floorToMonthUTC(max);
    while (cur <= end) {
      const v = map.get(cur) ?? { homepage: 0, closed: 0, other: 0 };
      rows.push({ ts: cur, label: labelForPeriod(cur, "month"), homepage: v.homepage, closed: v.closed, other: v.other });
      const d = new Date(cur);
      d.setUTCMonth(d.getUTCMonth() + 1);
      cur = d.getTime();
      if (rows.length > 1000) break;
    }
  } else {
    let cur = floor(min);
    const end = floor(max);
    while (cur <= end) {
      const v = map.get(cur) ?? { homepage: 0, closed: 0, other: 0 };
      rows.push({ ts: cur, label: labelForPeriod(cur, period), homepage: v.homepage, closed: v.closed, other: v.other });
      cur = (step ?? MS.day) + cur;
      if (rows.length > 5000) break;
    }
  }

  return rows;
}

export default function TimeEventGraph({ events }: { events: ParsedEvent[] }) {
  const [period, setPeriod] = React.useState<Period>("day");

  const aggregated = React.useMemo(() => groupByPeriod(events, period), [events, period]);

  if (!events.length) return;// <div className="no-logs">No Logs</div>;

  return (
    <div style={{ width: "100%", height: 360 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13 }}>Group by:</label>
        <select id="event-select" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>
          Showing {aggregated.length} bins · total events {events.length}
        </div>
      </div>

      <ResponsiveContainer>
        <BarChart data={aggregated} margin={{ top: 12, right: 24, left: 12, bottom: 80 }}>
          <CartesianGrid stroke="#f0f0f0" />
          <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            // formatter={(value: any, name: string) => [value, name]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          <Bar dataKey="homepage" name="homepage loaded" stackId="a" fill="#2e7d32" />
          <Bar dataKey="closed" name="page closed" stackId="a" fill="#c62828" />
          <Bar dataKey="other" name="formation loaded" stackId="a" fill="#8884d8" />
          <Brush dataKey="label" height={40} stroke="#8884d8" travellerWidth={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
// ...existing code...