import { useState } from 'react';
import CheckIn from './components/CheckIn';
import CommandCenter from './components/CommandCenter';
import WeeklyReview from './components/WeeklyReview';
import BycScorer from './components/BycScorer';
import Chat from './components/Chat';
import { hasCheckedInToday } from './utils/store';

const NAV_ITEMS = [
  { id: 'command', label: 'Command Center' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'review', label: 'Weekly Review' },
  { id: 'byc', label: 'BYC Scorer' },
];

export default function App() {
  const [view, setView] = useState(() => {
    return hasCheckedInToday() ? 'command' : 'checkin';
  });
  const [chatOpen, setChatOpen] = useState(false);

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

  const fabStyle = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
    display: chatOpen ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    transition: 'transform 0.2s',
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>
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
        {view === 'byc' && <BycScorer />}
      </main>

      {/* Floating chat button */}
      <button
        style={fabStyle}
        onClick={() => setChatOpen(true)}
        title="Open Chat"
      >
        &#x2709;
      </button>

      {/* Chat panel */}
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
