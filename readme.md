# Log Monitor

A small React + TypeScript + Vite app to import browser/event JSON logs and visualize them as interactive timelines and aggregated charts. Designed to help inspect event sequences (e.g. "homepage loaded", "page closed") across one or more log files, and to compute durations between events.

## Features
- Import one or multiple JSON log files (merge + deduplicate).
- Interactive timeline (Recharts) with per-event markers and brush/zoom.
- Aggregated stacked bar chart grouped by hour/day/week/month (counts per event type).
- Duration chart: sum / average / count of time from an event to the next "page closed".
- Source-aware events (filename stored) and optional filtering by event label / source.

## JSON log format
Expect a JSON object mapping ISO timestamps to event strings, e.g.:
{
  "2025-10-19T14:23:30Z": "homepage loaded",
  "2025-10-19T14:24:05Z": "page closed"
}

Any event label not recognized as "homepage loaded" or "page closed" is treated as "other".

## Quick start (Windows)
1. Install deps:
   - Open terminal in project root
   - npm install
   - npm install recharts
2. Run dev server:
   - npm run dev
3. Open the app in your browser (Vite prints the URL).

## Usage
- Click "Import JSON files" and select one or more .json files (hold Ctrl / Shift for multiple).
- Timeline chart: view events across time; use the brush to zoom to a specific range.
- Aggregate chart: choose grouping (hour/day/week/month) to see stacked counts.
- Duration chart: compute durations from a start event to the next "page closed"; switch metric (sum / avg / count) and grouping.

## Tips & Troubleshooting
- If a file doesn't parse, open DevTools console — the importer logs per-file errors.
- The importer strips common BOM/comments; for tricky files you can rename or validate JSON with a linter.
- For large datasets, increase aggregation server-side or reduce bin granularity.

## Development notes
- Built with Vite + React + TypeScript.
- Charts use Recharts; install via npm if missing.
- Files are merged and deduplicated by timestamp + source + event.
