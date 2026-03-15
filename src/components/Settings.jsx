import { useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [weights, setWeights] = useState({
    equity: 0.3,
    absentee: 0.2,
    vacant: 0.2,
    yearsOwned: 0.15,
    taxDelinquent: 0.15,
  });
  const [scored, setScored] = useState(null);

  const updateWeight = (key, val) => {
    setWeights(w => ({ ...w, [key]: parseFloat(val) || 0 }));
  };

  const handleRescore = async () => {
    const result = await api.scoreLeads(weights);
    setScored(result.scored);
  };

  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  return (
    <div>
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Lead Scoring Settings</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Scoring Weights</h3>
        <p style={styles.desc}>
          Adjust the importance of each motivation indicator. Weights should sum to 1.0 for best results.
        </p>

        <WeightSlider label="High Equity" value={weights.equity} onChange={v => updateWeight('equity', v)} />
        <WeightSlider label="Absentee Owner" value={weights.absentee} onChange={v => updateWeight('absentee', v)} />
        <WeightSlider label="Vacant Property" value={weights.vacant} onChange={v => updateWeight('vacant', v)} />
        <WeightSlider label="Years Owned" value={weights.yearsOwned} onChange={v => updateWeight('yearsOwned', v)} />
        <WeightSlider label="Tax Delinquent" value={weights.taxDelinquent} onChange={v => updateWeight('taxDelinquent', v)} />

        <div style={styles.totalRow}>
          <span>Total Weight:</span>
          <span style={{ color: Math.abs(total - 1) < 0.01 ? '#34d399' : '#f87171', fontWeight: 700 }}>
            {total.toFixed(2)}
          </span>
        </div>

        <button onClick={handleRescore} style={styles.scoreBtn}>
          Re-Score All Leads
        </button>

        {scored != null && (
          <p style={{ color: '#34d399', fontSize: '14px', marginTop: '8px' }}>
            Scored {scored} leads with updated weights
          </p>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '16px' }}>
        <h3 style={styles.cardTitle}>Scraper Configuration</h3>
        <p style={styles.desc}>
          Configure the PropStream scraper via the <code style={styles.code}>.env</code> file:
        </p>
        <div style={styles.envBlock}>
          <div style={styles.envRow}>
            <span style={styles.envKey}>PROPSTREAM_EMAIL</span>
            <span style={styles.envVal}>Your PropStream login email</span>
          </div>
          <div style={styles.envRow}>
            <span style={styles.envKey}>PROPSTREAM_PASSWORD</span>
            <span style={styles.envVal}>Your PropStream password</span>
          </div>
          <div style={styles.envRow}>
            <span style={styles.envKey}>DEFAULT_LOCATIONS</span>
            <span style={styles.envVal}>Comma-separated zip codes or city names</span>
          </div>
          <div style={styles.envRow}>
            <span style={styles.envKey}>PORT</span>
            <span style={styles.envVal}>API server port (default: 3001)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightSlider({ label, value, onChange }) {
  return (
    <div style={styles.sliderRow}>
      <label style={styles.sliderLabel}>{label}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.slider}
      />
      <span style={styles.sliderValue}>{value.toFixed(2)}</span>
    </div>
  );
}

const styles = {
  card: {
    background: '#1e293b', borderRadius: '12px', padding: '24px',
    border: '1px solid #334155',
  },
  cardTitle: { margin: '0 0 8px', fontSize: '18px', fontWeight: 600 },
  desc: { margin: '0 0 20px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' },
  sliderRow: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
  },
  sliderLabel: { width: '140px', fontSize: '14px', color: '#cbd5e1' },
  slider: { flex: 1, accentColor: '#38bdf8' },
  sliderValue: { width: '40px', fontSize: '14px', fontWeight: 600, color: '#38bdf8', textAlign: 'right' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', marginTop: '8px', borderTop: '1px solid #334155',
    fontSize: '15px', color: '#e2e8f0',
  },
  scoreBtn: {
    marginTop: '16px', padding: '10px 24px', background: '#818cf8', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
  code: {
    background: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '13px',
  },
  envBlock: {
    background: '#0f172a', borderRadius: '8px', padding: '16px',
    border: '1px solid #334155',
  },
  envRow: {
    display: 'flex', justifyContent: 'space-between', padding: '6px 0',
    borderBottom: '1px solid #1e293b',
  },
  envKey: { fontFamily: 'monospace', fontSize: '13px', color: '#38bdf8' },
  envVal: { fontSize: '13px', color: '#64748b' },
};
