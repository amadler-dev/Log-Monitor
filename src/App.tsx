import { useState } from 'react'
import './App.css'
import type { ParsedEvent } from './utils/analytics';
import { generateExcel } from './utils/exportUtils';
import type { ExportOptions } from './utils/exportUtils';
import FileDropzone from './components/FileDropzone';
import SummaryCards from './components/SummaryCards';
import ExportModal from './components/ExportModal';
import TimeEventGraph from './TimeEventGraph';
import DurationChart from "./DurationChart";
import PageDurationChart from "./PageDurationChart";
import SessionChart from "./SessionChart";
import ClicksChart from "./ClicksChart";
import DeviceChart from "./DeviceChart";
import ResolutionChart from "./ResolutionChart";
import EngagementChart from "./EngagementChart";

function App() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [loadedFiles, setLoadedFiles] = useState<Set<string>>(new Set());
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleLoad = (newEvents: ParsedEvent[]) => {
    setEvents(prev => {
      const merged = [...prev, ...newEvents];
      const seen = new Set<string>();

      const deduped = merged.filter(e => {
        const key = `${e.ts}|${e.source ?? ""}|${e.type}|${e.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => a.ts - b.ts);

      return deduped;
    });

    // Update loaded files list
    setLoadedFiles(prev => {
      const next = new Set(prev);
      newEvents.forEach(e => {
        if (e.source) next.add(e.source);
      });
      return next;
    });
  };

  const handleExport = (options: ExportOptions) => {
    generateExcel(events, options);
    setIsExportOpen(false);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Log Analytics</h1>
        {events.length > 0 && (
          <div className="header-controls">
            <span className="subtitle">{events.length} events loaded</span>

            <span
              className="subtitle"
              title={Array.from(loadedFiles).join('\n')}
              style={{ cursor: 'help', textDecoration: 'underline dotted' }}
            >
              {loadedFiles.size} Files Loaded
            </span>

            <button
              onClick={() => setIsExportOpen(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Export to Excel
            </button>
          </div>
        )}
      </header>

      <div className="dashboard-controls">
        <FileDropzone onLoad={handleLoad} />
      </div>

      {events.length > 0 && (
        <>
          <section className="dashboard-summary">
            <SummaryCards events={events} />
          </section>

          <section className="dashboard-grid">
            <div className="card chart-card full-width">
              <h3>Timeline Activity</h3>
              <TimeEventGraph events={events} />
            </div>

            <div className="card chart-card">
              <h3>Session Duration Distribution</h3>
              <DurationChart events={events} />
            </div>

            <div className="card chart-card">
              <h3>Sessions Over Time</h3>
              <SessionChart events={events} />
            </div>

            <div className="card chart-card full-width">
              <h3>Time per Page</h3>
              <PageDurationChart events={events} />
            </div>

            <div className="card chart-card full-width">
              <h3>Top Clicks</h3>
              <ClicksChart events={events} />
            </div>

            <div className="card chart-card full-width">
              <h3>Device Stats</h3>
              <DeviceChart events={events} />
            </div>

            <div className="card chart-card full-width">
              <h3>Screen Resolutions</h3>
              <ResolutionChart events={events} />
            </div>

            <div className="card chart-card full-width">
              <h3>Engagement (Active vs Background)</h3>
              <EngagementChart events={events} />
            </div>
          </section>
        </>
      )}

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
      />
    </div>
  )
}

export default App
