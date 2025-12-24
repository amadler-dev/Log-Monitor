import { useState, useEffect } from 'react'
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

  const [userAgents, setUserAgents] = useState<string[]>([]);
  const [selectedUserAgent, setSelectedUserAgent] = useState<string>('');

  const fetchLogs = async (ua: string = '') => {
    try {
      let url = 'http://localhost:5000/api/logs';
      if (ua) {
        url += `?userAgent=${encodeURIComponent(ua)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data: any[] = await res.json();

      // Ensure dates are parsed correctly if they are strings
      const parsedData = data.map(d => ({
        ...d,
        ts: d.timestamp ? new Date(d.timestamp).getTime() : Date.now(),
        time: d.timestamp || new Date().toISOString()
      })) as ParsedEvent[];
      // Sort
      parsedData.sort((a, b) => a.ts - b.ts);

      handleLoad(parsedData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserAgents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/user-agents');
      if (!res.ok) throw new Error('Failed to fetch user agents');
      const data = await res.json();
      setUserAgents(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    fetchUserAgents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ua = e.target.value;
    setSelectedUserAgent(ua);
    // Clear current events to show only filtered ones? Or filter locally?
    // User asked to choose which User Agent to see.
    // Let's clear and re-fetch for simplicity or filter current?
    // Given the backend has filtering, let's use it.
    setEvents([]);
    fetchLogs(ua);
  };

  const handleLoad = (newEvents: ParsedEvent[]) => {
    setEvents(prev => {
      // Backend might return duplicates if we fetch multiple times?
      // But here we are replacing mostly?
      // If we use file dropzone AND api, we might want to merge. 
      // Current logic merges.
      const merged = [...prev, ...newEvents];
      const seen = new Set<string>();

      const deduped = merged.filter(e => {
        // Fix key generation to use timestamp from backend which might be 'timestamp' or mapped 'ts'
        const ts = e.ts || new Date((e as any).timestamp).getTime();
        const key = `${ts}|${e.userAgent ?? e.source ?? ""}|${e.type}|${e.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => a.ts - b.ts);

      return deduped;
    });

    // Update loaded files list (mock source for API)
    setLoadedFiles(prev => {
      const next = new Set(prev);
      newEvents.forEach(e => {
        if (e.source) next.add(e.source);
        else next.add('API');
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

            <select
              value={selectedUserAgent}
              onChange={handleUserAgentChange}
              style={{
                padding: '6px',
                borderRadius: '4px',
                marginRight: '10px'
              }}
            >
              <option value="">All Users</option>
              {userAgents.map(ua => (
                <option key={ua} value={ua}>{ua.substring(0, 50)}...</option>
              ))}
            </select>

            <span
              className="subtitle"
              title={Array.from(loadedFiles).join('\n')}
              style={{ cursor: 'help', textDecoration: 'underline dotted' }}
            >
              {loadedFiles.size} Sources
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
