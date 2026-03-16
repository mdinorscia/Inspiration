import { useState, useEffect } from 'react';
import { CATEGORIES, getScoreColor, getWeekNumber, formatDate, getTodayKey } from '../utils/constants';
import { getToday, getCarriedForward, togglePriority, getWeekEntries } from '../utils/store';

export default function CommandCenter() {
  const [, setTick] = useState(0);
  const today = getToday();
  const carried = getCarriedForward();
  const todayKey = getTodayKey();
  const weekEntries = getWeekEntries();

  const forceUpdate = () => setTick((t) => t + 1);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const weekNum = getWeekNumber();

  const cardStyle = {
    background: 'var(--bg-card)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    padding: 20,
    marginBottom: 16,
  };

  function handleToggle(dayKey, index) {
    togglePriority(dayKey, index);
    forceUpdate();
  }

  // Compute weekly priorities: aggregate all week's priorities that aren't done
  const weeklyPriorities = [];
  for (const entry of weekEntries) {
    if (entry.priorities) {
      for (const p of entry.priorities) {
        if (!p.done && entry.date !== todayKey) {
          weeklyPriorities.push({ ...p, fromDate: entry.date });
        }
      }
    }
  }

  if (!today) {
    return (
      <div className="slide-up" style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No check-in yet today</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Start your morning check-in to see your command center.
        </p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{dateStr}</p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Week {weekNum} of 52</p>
      </div>

      {/* Carried Forward */}
      {carried.length > 0 && (
        <div style={{ ...cardStyle, borderColor: 'var(--amber)', borderLeft: '3px solid var(--amber)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 10 }}>
            Carried Forward
          </p>
          {carried.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)' }}>{item.level}</span>
              <span style={{ fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scorecard */}
      <div style={cardStyle}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Scorecard</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const score = today.scores?.[cat.id] ?? 0;
            const color = getScoreColor(score);
            return (
              <div
                key={cat.id}
                style={{
                  background: 'var(--bg-input)',
                  borderRadius: 10,
                  padding: '12px 10px',
                  textAlign: 'center',
                  border: `1px solid ${color}22`,
                }}
              >
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color }}>{score}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Priorities */}
      {today.priorities && (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Today's Priorities</p>
          {today.priorities.map((item, i) => {
            const color = item.level === 'P1' ? 'var(--red)' : item.level === 'P2' ? 'var(--amber)' : 'var(--green)';
            const bg = item.level === 'P1' ? 'var(--red-bg)' : item.level === 'P2' ? 'var(--amber-bg)' : 'var(--green-bg)';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: i < today.priorities.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.done || false}
                  onChange={() => handleToggle(todayKey, i)}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: 'var(--accent)',
                    cursor: 'pointer',
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color,
                    background: bg,
                    padding: '2px 8px',
                    borderRadius: 4,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {item.level}
                </span>
                <div>
                  <p style={{ fontSize: 14, textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.text}
                  </p>
                  {item.delegation && (
                    <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
                      Delegate to {item.delegation.name} ({item.delegation.role})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Uncompleted */}
      {weeklyPriorities.length > 0 && (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>This Week — Uncompleted</p>
          {weeklyPriorities.map((item, i) => {
            const color = item.level === 'P1' ? 'var(--red)' : item.level === 'P2' ? 'var(--amber)' : 'var(--green)';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom: i < weeklyPriorities.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{item.level}</span>
                <span style={{ fontSize: 13 }}>{item.text}</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  {item.fromDate}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
