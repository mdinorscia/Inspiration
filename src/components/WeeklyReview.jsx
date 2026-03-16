import { useState } from 'react';
import { CATEGORIES, getScoreColor } from '../utils/constants';
import { getWeekEntries, saveWeeklyReview, getWeeklyReview } from '../utils/store';
import { generateWeeklySummary } from '../utils/priorities';

export default function WeeklyReview() {
  const weekEntries = getWeekEntries();
  const existingReview = getWeeklyReview();

  const [wins, setWins] = useState(existingReview?.wins || ['', '', '']);
  const [adjustment, setAdjustment] = useState(existingReview?.adjustment || '');
  const [summary, setSummary] = useState(existingReview ? generateWeeklySummary(weekEntries, existingReview.wins, existingReview.adjustment) : null);
  const [submitted, setSubmitted] = useState(!!existingReview);

  const cardStyle = {
    background: 'var(--bg-card)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    padding: 20,
    marginBottom: 16,
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
  };

  const btnPrimary = {
    width: '100%',
    padding: '12px 24px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };

  // Build score history table
  const scoreHistory = {};
  for (const cat of CATEGORIES) {
    scoreHistory[cat.id] = [];
  }
  const dates = [];
  for (const entry of weekEntries) {
    dates.push(entry.date);
    for (const cat of CATEGORIES) {
      scoreHistory[cat.id].push(entry.scores?.[cat.id] ?? null);
    }
  }

  function handleSubmit() {
    const filteredWins = wins.filter((w) => w.trim());
    saveWeeklyReview({ wins: filteredWins, adjustment });
    const s = generateWeeklySummary(weekEntries, filteredWins, adjustment);
    setSummary(s);
    setSubmitted(true);
  }

  return (
    <div className="slide-up">
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Weekly Review</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {weekEntries.length} check-in{weekEntries.length !== 1 ? 's' : ''} this week
        </p>
      </div>

      {/* Score History */}
      {weekEntries.length > 0 && (
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Score History</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 500 }}>Category</th>
                  {dates.map((d) => (
                    <th key={d} style={{ padding: '6px 8px', color: 'var(--text-dim)', fontWeight: 500, fontSize: 11 }}>
                      {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ padding: '6px 8px', fontWeight: 500 }}>{cat.label}</td>
                    {scoreHistory[cat.id].map((score, i) => (
                      <td key={i} style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {score != null ? (
                          <span style={{ fontWeight: 700, color: getScoreColor(score) }}>{score}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3 Wins */}
      <div style={cardStyle}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>3 Wins This Week</p>
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder={`Win #${i + 1}`}
            value={wins[i]}
            onChange={(e) => {
              const updated = [...wins];
              updated[i] = e.target.value;
              setWins(updated);
            }}
            disabled={submitted}
          />
        ))}
      </div>

      {/* Adjustment */}
      <div style={cardStyle}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>One Adjustment for Next Week</p>
        <input
          style={inputStyle}
          placeholder="What will you do differently?"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          disabled={submitted}
        />
      </div>

      {!submitted && (
        <button style={btnPrimary} onClick={handleSubmit}>
          Submit Weekly Review
        </button>
      )}

      {/* Summary */}
      {summary && (
        <div className="slide-up" style={{ marginTop: 16 }}>
          <div style={{ ...cardStyle, borderColor: 'var(--accent)', borderLeft: '3px solid var(--accent)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>Weekly Summary</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{summary.checkInDays}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Check-ins</p>
              </div>
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{summary.completionRate}%</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completion</p>
              </div>
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800 }}>{summary.completedPriorities}/{summary.totalPriorities}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Done</p>
              </div>
            </div>

            {/* Averages + Trends */}
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Category Averages</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const avg = summary.averages[cat.id];
                const trend = summary.trends[cat.id];
                if (avg == null) return null;
                const arrow = trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192';
                const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text-dim)';
                return (
                  <span
                    key={cat.id}
                    style={{
                      background: 'var(--bg-input)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontWeight: 800, color: getScoreColor(avg) }}>{avg}</span>
                    <span style={{ color: trendColor, fontSize: 14 }}>{arrow}</span>
                  </span>
                );
              })}
            </div>

            {/* Wins */}
            {summary.wins.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Wins</p>
                {summary.wins.map((w, i) => (
                  <p key={i} style={{ fontSize: 13, color: 'var(--green)', marginBottom: 2 }}>+ {w}</p>
                ))}
              </div>
            )}

            {/* Adjustment */}
            {summary.adjustment && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Adjustment</p>
                <p style={{ fontSize: 13, color: 'var(--amber)' }}>{summary.adjustment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {weekEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No check-ins this week yet. Complete some daily check-ins first.
          </p>
        </div>
      )}
    </div>
  );
}
