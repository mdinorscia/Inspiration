import { useState, useCallback } from 'react';
import { BYC_CATEGORIES, MAX_SCORE, saveBycScore, getBycScores } from '../utils/bycStore';

const BUILD_VERSION = 'v3-' + Date.now().toString(36);

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 28,
            cursor: 'pointer',
            color: star <= (hover || value) ? '#f59e0b' : 'var(--text-dim)',
            transition: 'color 0.15s, transform 0.15s',
            transform: star <= hover ? 'scale(1.15)' : 'scale(1)',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function BycScorer() {
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [scores, setScores] = useState(() => {
    const init = {};
    BYC_CATEGORIES.forEach((c) => (init[c.id] = 0));
    return init;
  });
  const [notes, setNotes] = useState('');
  const [anchorTenant, setAnchorTenant] = useState('');
  const [firstWatchDistance, setFirstWatchDistance] = useState('');
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => getBycScores());

  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0);

  function handleScore(id, value) {
    setScores((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    // Validate - only require site name
    if (!siteName.trim()) {
      setSubmitState('error');
      setErrorMsg('Please enter a site name.');
      return;
    }

    // Clear previous errors
    setErrorMsg('');

    // Build payload
    const payload = {
      siteName: siteName.trim(),
      siteAddress: siteAddress.trim(),
      scores,
      totalScore,
      maxScore: MAX_SCORE,
      notes: notes.trim(),
      anchorTenant: anchorTenant.trim(),
      firstWatchDistance: firstWatchDistance.trim(),
    };

    // Attempt save — catch absolutely everything
    try {
      saveBycScore(payload);
    } catch (err) {
      setSubmitState('error');
      setErrorMsg('Save error: ' + (err && err.message ? err.message : String(err)));
      return;
    }

    // Save succeeded
    setSubmitState('success');

    // Refresh history (non-critical)
    try { setHistory(getBycScores()); } catch (_) { /* ignore */ }

    // Reset form after delay
    setTimeout(() => {
      setSiteName('');
      setSiteAddress('');
      setScores(() => {
        const init = {};
        BYC_CATEGORIES.forEach((c) => (init[c.id] = 0));
        return init;
      });
      setNotes('');
      setAnchorTenant('');
      setFirstWatchDistance('');
      setSubmitState('idle');
    }, 2500);
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
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
  };

  const sectionLabel = {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  };

  const btnPrimary = {
    width: '100%',
    padding: '14px 24px',
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: submitState === 'submitting' ? 'wait' : 'pointer',
    opacity: submitState === 'submitting' ? 0.7 : 1,
    transition: 'all 0.2s',
  };

  // Group categories by section
  const sections = [];
  let currentSection = null;
  for (const cat of BYC_CATEGORIES) {
    if (cat.section !== currentSection) {
      currentSection = cat.section;
      sections.push({ label: cat.section, items: [] });
    }
    sections[sections.length - 1].items.push(cat);
  }

  return (
    <div className="slide-up">
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>BYC Site Scorer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Rate each category 1-5 stars
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2 }}>
          {BUILD_VERSION}
        </p>
      </div>

      {/* Site Info */}
      <div style={cardStyle}>
        <input
          style={{ ...inputStyle, marginBottom: 10, fontSize: 16, fontWeight: 600 }}
          placeholder="Site Name"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Address (optional)"
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
        />
      </div>

      {/* Scoring Sections */}
      {sections.map((section) => (
        <div key={section.label}>
          <p style={sectionLabel}>{section.label}</p>
          {section.items.map((cat) => (
            <div key={cat.id} style={cardStyle} className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: scores[cat.id] > 0 ? '#f59e0b' : 'var(--text-dim)' }}>
                  {scores[cat.id]}/5
                </span>
              </div>
              <StarRating value={scores[cat.id]} onChange={(v) => handleScore(cat.id, v)} />
            </div>
          ))}
        </div>
      ))}

      {/* Notes & Details */}
      <p style={sectionLabel}>Notes & Details</p>
      <div style={cardStyle}>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 12 }}
          placeholder="Site notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <input
          style={{ ...inputStyle, marginBottom: 12 }}
          placeholder="Anchor Tenant"
          value={anchorTenant}
          onChange={(e) => setAnchorTenant(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="First Watch distance (e.g. .2 miles)"
          value={firstWatchDistance}
          onChange={(e) => setFirstWatchDistance(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {submitState === 'error' && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Success Message */}
      {submitState === 'success' && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--green)',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Score submitted successfully!
        </div>
      )}

      {/* Submit Button */}
      <button
        style={btnPrimary}
        onClick={handleSubmit}
        disabled={submitState === 'submitting'}
      >
        {submitState === 'submitting' ? 'Submitting...' : `Submit Score (${totalScore}/${MAX_SCORE})`}
      </button>

      {/* History Toggle */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {showHistory ? 'Hide' : 'Show'} Previous Scores ({history.length})
          </button>

          {showHistory && (
            <div style={{ marginTop: 12 }}>
              {history.map((site) => (
                <div key={site.id} style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{site.siteName}</p>
                      {site.siteAddress && (
                        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{site.siteAddress}</p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: site.totalScore >= 55 ? 'var(--green)' : site.totalScore >= 40 ? 'var(--amber)' : 'var(--red)',
                      }}
                    >
                      {site.totalScore}/{site.maxScore}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                    {new Date(site.submittedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
