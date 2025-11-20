import { useState } from 'react'
// import logFileLogo from './assets/log-file-outline-icon.svg'
import analyticsLogo from './assets/monitoring.svg'
import './App.css'
import JsonImportButton, { type ParsedEvent } from './Import'
import TimeEventGraph from './TimeEventGraph';
import DurationChart from "./DurationChart";
import PageDurationChart from "./PageDurationChart";
import SessionChart from "./SessionChart";
import ClicksChart from "./ClicksChart";

function App() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);

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
  };

  return (
    <>
      <img src={analyticsLogo} className="logo" alt="logo" />
      <h1>Log Monitor</h1>

      <div className='graph'>
        <JsonImportButton onLoad={handleLoad} />
        <TimeEventGraph events={events} />
        <DurationChart events={events} />
        <PageDurationChart events={events} />
        <SessionChart events={events} />
        <ClicksChart events={events} />
      </div>
    </>
  )
}

export default App
