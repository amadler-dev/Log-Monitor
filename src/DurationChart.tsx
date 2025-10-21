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
  if (period === "week") return d.toISOString().slice(0, 10);
  if (period === "month") return d.toISOString().slice(0, 7);
  if (period === "hour") return d.toISOString().slice(0, 13).replace("T", " ") + ":00Z";
  return d.toISOString().slice(0, 10);
}


// compute pairs: for each non-"page closed" event, find next "page closed"
function computePairs(events: ParsedEvent[]) {

  const pairs: { startTs: number; closeTs: number; durationMs: number; label: string; source?: string }[] = [];

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    if (e.pageClosed) 
        continue; // skip closes as starts

    // find next page closed
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].pageClosed) {
        const dur = events[j].ts - e.ts;
        if (dur >= 0) {
          pairs.push({ startTs: e.ts, closeTs: events[j].ts, durationMs: dur, label: e.event, source: e.source });
        }
        break;
      }
    }
  }
  return pairs;
}


function groupDurationsByPeriod(pairs: { startTs: number; durationMs: number }[], period: Period) {

  const map = new Map<number, { sumHs: number; count: number }>();
  const floor =
    period === "hour"
      ? floorToHourUTC
      : period === "week"
      ? floorToWeekUTC
      : period === "month"
      ? floorToMonthUTC
      : floorToDayUTC;

  for (const p of pairs) {
    const k = floor(p.startTs);
    const cur = map.get(k) ?? { sumHs: 0, count: 0 };
    cur.sumHs += p.durationMs;
    cur.count += 1;
    map.set(k, cur);
  }

  if (pairs.length === 0) 
    return [];


  const keys = Array.from(map.keys()).sort((a, b) => a - b);
  const min = keys[0];
  const max = keys[keys.length - 1];
  const rows: { ts: number; label: string; sumHours: number; count: number; avgMinutes: number }[] = [];

  if (period === "month") {

    let cur = floorToMonthUTC(min);
    const end = floorToMonthUTC(max);

    while (cur <= end) {
      const v = map.get(cur) ?? { sumHs: 0, count: 0 };

      rows.push({
        ts: cur,
        label: labelForPeriod(cur, period),
        sumHours: Math.round(v.sumHs / 60000 / 60),
        count: v.count,
        avgMinutes: v.count ? Math.round(v.sumHs / v.count / 1000) / 60 : 0,
      });

      const d = new Date(cur);
      d.setUTCMonth(d.getUTCMonth() + 1);
      cur = d.getTime();

      if (rows.length > 2000) break;
    }
  }

  // fallback implementation for non-month (build contiguous bins)
  if (period !== "month") {
    const step = period === "hour" ? MS.hour : period === "week" ? MS.week : MS.day;
    let cur = (period === "hour" ? floorToHourUTC(min) : period === "week" ? floorToWeekUTC(min) : floorToDayUTC(min));
    const end = period === "hour" ? floorToHourUTC(max) : period === "week" ? floorToWeekUTC(max) : floorToDayUTC(max);
    while (cur <= end) {
      const v = map.get(cur) ?? { sumHs: 0, count: 0 };
      rows.push({
        ts: cur,
        label: labelForPeriod(cur, period),
        sumHours: Math.round((v.sumHs / 60000) * 100) / 60 / 60,
        count: v.count,
        avgMinutes: v.count ? Math.round(v.sumHs / v.count / 1000) : 0,
      });
      cur += step;
      if (rows.length > 5000) break;
    }
  }

  return rows;
}


export default function DurationChart({ events }: { events: ParsedEvent[] }) {
  const [period, setPeriod] = React.useState<Period>("day");
  const [metric, setMetric] = React.useState<"sum" | "avg" | "count">("sum");

  const pairs = React.useMemo(() => computePairs(events), [events]);
  const aggregated = React.useMemo(() => groupDurationsByPeriod(pairs.map(p => ({ startTs: p.startTs, durationMs: p.durationMs })), period), [pairs, period]);

  if (!events.length) return <div className="no-logs">Import json log file to start monitoring...</div>;
  if (!pairs.length) return <div className="no-logs">No matching start - close pairs found</div>;

  return (
    <div style={{ width: "100%", height: 360, marginTop: 100 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13 }}>Group by:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>

        <label style={{ fontSize: 13, marginLeft: 12 }}>Metric:</label>
        <select id="duration-select" value={metric} onChange={(e) => setMetric(e.target.value as "sum" | "avg" | "count")}>
          <option value="sum">Sum durations (hours)</option>
          <option value="avg">Average duration (minutes)</option>
          <option value="count">Count pairs</option>
        </select>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>
          pairs {pairs.length} · bins {aggregated.length}
        </div>
      </div>

      <ResponsiveContainer width={1000} height={400}>
        <BarChart data={aggregated} margin={{ top: 12, right: 24, left: 12, bottom: 80 }}>
          <CartesianGrid stroke="#f0f0f0" />
          <XAxis dataKey="label" angle={-45} textAnchor="end" interval={0} height={70} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "sumHours") return [`${value} min`, "sum"];
              if (name === "avgMinutes") return [`${value} s`, "avg"];
              if (name === "count") return [value, "count"];
              return [value, name];
            }}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend />
          {metric === "sum" && <Bar dataKey="sumHours" name="sum hours" fill="#1976d2" />}
          {metric === "avg" && <Bar dataKey="avgMinutes" name="avg minutes" fill="#ff8f00" />}
          {metric === "count" && <Bar dataKey="count" name="count" fill="#2e7d32" />}
          <Brush dataKey="label" height={40} stroke="#8884d8" travellerWidth={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}