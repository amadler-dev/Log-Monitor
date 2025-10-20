import { useState } from 'react'
// import logFileLogo from './assets/log-file-outline-icon.svg'
import analyticsLogo from './assets/monitoring-svgrepo-com.svg'
import './App.css'
import JsonImportButton, { type ParsedEvent } from './Import'
import TimeEventGraph from './TimeEventGraph';
import DurationChart from "./DurationChart";

function App() {
  // const [data, setData] = useState<unknown>(null);
  const [events, setEvents] = useState<ParsedEvent[]>([]);

  const handleLoad = (newEvents: ParsedEvent[]) => {
    setEvents(prev => {
      const merged = [...prev, ...newEvents];
      const seen = new Set<string>();
      const deduped = merged.filter(e => {
        const key = `${e.ts}|${e.source ?? ""}|${e.event}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => a.ts - b.ts);
      return deduped;
    });
  };

  return (
    <>
      <div>
          <img src={analyticsLogo} className="logo react" alt="React logo" />
      </div>
      <h1>Log Monitor</h1>
      <div className="card">
        <p>
          Import json log file to start monitoring...
        </p>
        <div>
          <JsonImportButton onLoad={handleLoad} />
          <div className='graph'>
            <TimeEventGraph events={events} />
            <DurationChart events={events} />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
