import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard({ onViewLeads }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading dashboard...</p>;

  if (!stats || stats.total === 0) {
    return (
      <div style={styles.empty}>
        <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Welcome to PropStream Lead Generator</h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Get started by importing leads from PropStream or running the scraper.
        </p>
        <div style={styles.steps}>
          <StepCard number="1" title="Configure" desc="Add your PropStream credentials to .env" />
          <StepCard number="2" title="Scrape or Import" desc="Run 'npm run scrape' or import a CSV export" />
          <StepCard number="3" title="Score & Filter" desc="Auto-score leads and filter for the hottest prospects" />
          <StepCard number="4" title="Outreach" desc="Track campaigns, calls, and responses" />
        </div>
      </div>
    );
  }

  const statusColors = {
    new: '#38bdf8',
    contacted: '#fbbf24',
    qualified: '#34d399',
    closed: '#818cf8',
    dead: '#64748b',
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Pipeline Overview</h2>

      <div style={styles.grid}>
        <StatCard label="Total Leads" value={stats.total} color="#38bdf8" />
        <StatCard label="Hot Leads (70+)" value={stats.hotLeads} color="#f87171" />
        <StatCard label="Avg Score" value={stats.avgScore} color="#34d399" />
        <StatCard
          label="Locations"
          value={Object.keys(stats.byLocation).length}
          color="#fbbf24"
        />
      </div>

      <div style={{ ...styles.grid, marginTop: '20px' }}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Lead Status Breakdown</h3>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} style={styles.barRow}>
              <span style={styles.barLabel}>{status}</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${(count / stats.total) * 100}%`,
                  background: statusColors[status] || '#64748b',
                }} />
              </div>
              <span style={styles.barCount}>{count}</span>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Leads by Location</h3>
          {Object.entries(stats.byLocation).map(([loc, count]) => (
            <div key={loc} style={styles.barRow}>
              <span style={styles.barLabel}>{loc}</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${(count / stats.total) * 100}%`,
                  background: '#818cf8',
                }} />
              </div>
              <span style={styles.barCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onViewLeads} style={styles.viewBtn}>View All Leads</button>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ fontSize: '32px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNum}>{number}</div>
      <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{desc}</p>
    </div>
  );
}

const styles = {
  empty: { textAlign: 'center', padding: '60px 20px' },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' },
  stepCard: { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' },
  stepNum: {
    width: '36px', height: '36px', borderRadius: '50%', background: '#334155',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: 700, color: '#38bdf8',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  statCard: {
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    border: '1px solid #334155', textAlign: 'center',
  },
  card: {
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    border: '1px solid #334155',
  },
  cardTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: 600 },
  barRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  barLabel: { width: '100px', fontSize: '13px', color: '#94a3b8', textTransform: 'capitalize' },
  barTrack: { flex: 1, height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s' },
  barCount: { width: '40px', fontSize: '13px', color: '#cbd5e1', textAlign: 'right' },
  viewBtn: {
    marginTop: '24px', padding: '10px 24px', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
};
