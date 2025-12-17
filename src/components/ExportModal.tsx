import React from 'react';
import type { ExportOptions } from '../utils/exportUtils';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
};

export default function ExportModal({ isOpen, onClose, onExport }: Props) {
    const [options, setOptions] = React.useState<ExportOptions>({
        summary: true,
        timeline: true,
        sessions: true,
        pageTimes: true,
        clicks: true,
        device: true
    });

    if (!isOpen) return null;

    const toggle = (key: keyof ExportOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)', padding: '2rem', borderRadius: '12px',
                width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <h3 style={{ marginTop: 0 }}>Export to Excel</h3>
                <p>Select the data you want to include:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
                    <label><input type="checkbox" checked={options.summary} onChange={() => toggle('summary')} /> Summary Stats</label>
                    <label><input type="checkbox" checked={options.timeline} onChange={() => toggle('timeline')} /> Timeline Activity</label>
                    <label><input type="checkbox" checked={options.sessions} onChange={() => toggle('sessions')} /> Session Data</label>
                    <label><input type="checkbox" checked={options.pageTimes} onChange={() => toggle('pageTimes')} /> Page Durations</label>
                    <label><input type="checkbox" checked={options.clicks} onChange={() => toggle('clicks')} /> Clicks</label>
                    <label><input type="checkbox" checked={options.device} onChange={() => toggle('device')} /> Device & Screen Stats</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onExport(options)}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--accent-color)', color: 'white', cursor: 'pointer' }}
                    >
                        Download Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
