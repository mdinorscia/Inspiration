import { useState } from 'react';
import { CATEGORIES, TRACKS, getScoreColor } from '../utils/constants';
import { saveDailyScores, saveTrackActions, savePriorities, getCarriedForward } from '../utils/store';
import { generatePriorities } from '../utils/priorities';

const STEPS = ['scores', 'tracks', 'generate'];

export default function CheckIn({ onComplete }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState(() => {
    const init = {};
    CATEGORIES.forEach((c) => (init[c.id] = 7));
    return init;
  });
  const [notes, setNotes] = useState({});
  const [trackActions, setTrackActions] = useState({});
  const [priorities, setPriorities] = useState(null);
  const [generating, setGenerating] = useState(false);

  const carried = getCarriedForward();

  function handleScoreChange(id, value) {
    setScores((prev) => ({ ...prev, [id]: Number(value) }));
  }

  function handleNoteChange(id, value) {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }

  function handleTrackAction(id, value) {
    setTrackActions((prev) => ({ ...prev, [id]: value }));
  }

  function nextStep() {
    if (step === 0) {
      saveDailyScores(scores, notes);
    }
    if (step === 1) {
      saveTrackActions(trackActions);
    }
    setStep(step + 1);
  }

  function handleGenerate() {
    setGenerating(true);
    // Simulate brief generation delay for UX
    setTimeout(() => {
      const items = generatePriorities(scores, notes, trackActions);
      setPriorities(items);
      savePriorities(items);
      setGenerating(false);
    }, 800);
  }

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
    marginTop: 8,
  };

  const btnSecondary = {
    ...btnPrimary,
    background: 'var(--bg-input)',
    color: 'var(--text-muted)',
  };

  // Step indicator
  const stepLabels = ['Score', 'Track Actions', 'Priorities'];

  return (
    <div className="slide-up">
      {/* Greeting */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Good morning Mike, let's run your check-in</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Step {step + 1} of 3: {stepLabels[step]}
        </p>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
          {stepLabels.map((_, i) => (
            <div
              key={i}
              style={{
                height: 4,
                width: 60,
                borderRadius: 2,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Carried Forward Banner */}
      {carried.length > 0 && step === 0 && (
        <div style={{ ...cardStyle, borderColor: 'var(--amber)', background: 'var(--amber-bg)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 8 }}>
            Carried Forward from Yesterday
          </p>
          {carried.map((item, i) => (
            <p key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
              <span style={{ color: 'var(--amber)', marginRight: 6 }}>{item.level}</span>
              {item.text}
            </p>
          ))}
        </div>
      )}

      {/* Step 1: Scores */}
      {step === 0 && (
        <div>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} style={cardStyle} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: getScoreColor(scores[cat.id]),
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {scores[cat.id]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores[cat.id]}
                onChange={(e) => handleScoreChange(cat.id, e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <input
                style={inputStyle}
                placeholder="Optional note..."
                value={notes[cat.id] || ''}
                onChange={(e) => handleNoteChange(cat.id, e.target.value)}
              />
            </div>
          ))}
          <button style={btnPrimary} onClick={nextStep}>
            Continue to Track Actions
          </button>
        </div>
      )}

      {/* Step 2: Track Actions */}
      {step === 1 && (
        <div>
          {TRACKS.map((track) => (
            <div key={track.id} style={cardStyle} className="fade-in">
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{track.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>{track.description}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{track.question}</p>
              <input
                style={inputStyle}
                placeholder="Your one action..."
                value={trackActions[track.id] || ''}
                onChange={(e) => handleTrackAction(track.id, e.target.value)}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnSecondary} onClick={() => setStep(0)}>
              Back
            </button>
            <button style={btnPrimary} onClick={nextStep}>
              Generate My Day
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Priorities */}
      {step === 2 && (
        <div>
          {!priorities && !generating && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <button style={btnPrimary} onClick={handleGenerate}>
                Generate My Day
              </button>
            </div>
          )}

          {generating && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analyzing your scores and generating priorities...</p>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: '3px solid var(--border)',
                  borderTop: '3px solid var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '16px auto',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {priorities && (
            <div className="slide-up">
              <div style={{ ...cardStyle, textAlign: 'center', borderColor: 'var(--green)', background: 'var(--green-bg)' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>Your day is set.</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {priorities.length} priorities generated. Go execute.
                </p>
              </div>

              {priorities.map((item, i) => {
                const color = item.level === 'P1' ? 'var(--red)' : item.level === 'P2' ? 'var(--amber)' : 'var(--green)';
                const bg = item.level === 'P1' ? 'var(--red-bg)' : item.level === 'P2' ? 'var(--amber-bg)' : 'var(--green-bg)';
                return (
                  <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${color}` }} className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color,
                          background: bg,
                          padding: '2px 8px',
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        {item.level}
                      </span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{item.text}</p>
                        {item.delegation && (
                          <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
                            Delegate to {item.delegation.name} ({item.delegation.role})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button style={btnPrimary} onClick={onComplete}>
                Go to Command Center
              </button>
            </div>
          )}

          {!generating && !priorities && (
            <button style={{ ...btnSecondary, marginTop: 8 }} onClick={() => setStep(1)}>
              Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
