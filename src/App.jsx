import { useState, useEffect } from 'react';
import CheckIn from './components/CheckIn';
import CommandCenter from './components/CommandCenter';
import WeeklyReview from './components/WeeklyReview';
import { hasCheckedInToday } from './utils/store';

const NAV_ITEMS = [
  { id: 'command', label: 'Command Center' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'review', label: 'Weekly Review' },
];

export default function App() {
  const [view, setView] = useState(() => {
    return hasCheckedInToday() ? 'command' : 'checkin';
  });

  const navStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px',
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  };

  const navBtnStyle = (active) => ({
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Grain & Grit <span style={{ color: 'var(--accent)' }}>Executive OS</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            Built for operators. No fluff.
          </p>
        </div>
        <nav style={navStyle}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              style={navBtnStyle(view === item.id)}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="fade-in" key={view}>
        {view === 'checkin' && <CheckIn onComplete={() => setView('command')} />}
        {view === 'command' && <CommandCenter />}
        {view === 'review' && <WeeklyReview />}
      </main>
    </div>
  );
}
