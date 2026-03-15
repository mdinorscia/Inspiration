import { useState, useEffect } from 'react';
import { api } from '../api';

const CAMPAIGN_TYPES = ['Direct Mail', 'Cold Call', 'SMS', 'Email', 'Door Knock'];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState(CAMPAIGN_TYPES[0]);

  useEffect(() => {
    api.getCampaigns().then(setCampaigns).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const campaign = await api.createCampaign(name.trim(), type);
    setCampaigns(prev => [campaign, ...prev]);
    setName('');
    setShowCreate(false);
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Outreach Campaigns</h2>
        <button onClick={() => setShowCreate(!showCreate)} style={styles.createBtn}>
          {showCreate ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showCreate && (
        <div style={styles.createForm}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Campaign name (e.g., March Absentee Owners)"
            style={styles.input}
          />
          <select value={type} onChange={e => setType(e.target.value)} style={styles.select}>
            {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleCreate} style={styles.saveBtn}>Create Campaign</button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: '#94a3b8' }}>No campaigns yet. Create one to start tracking outreach.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {campaigns.map(c => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{c.name}</h3>
                <span style={styles.typeBadge}>{c.type}</span>
              </div>
              <div style={styles.statsRow}>
                <Stat label="Leads" value={c.lead_count} />
                <Stat label="Sent" value={c.sent_count} />
                <Stat label="Responses" value={c.response_count} />
                <Stat
                  label="Response Rate"
                  value={c.sent_count > 0 ? `${Math.round((c.response_count / c.sent_count) * 100)}%` : '—'}
                />
              </div>
              <div style={styles.statusRow}>
                <span style={{
                  ...styles.statusBadge,
                  background: c.status === 'active' ? '#34d39922' : '#33415522',
                  color: c.status === 'active' ? '#34d399' : '#94a3b8',
                }}>
                  {c.status}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Created {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px',
  },
  createBtn: {
    padding: '8px 16px', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  createForm: {
    display: 'flex', gap: '12px', alignItems: 'center',
    background: '#1e293b', borderRadius: '12px', padding: '16px',
    border: '1px solid #334155', marginBottom: '16px',
  },
  input: {
    flex: 1, padding: '10px 14px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '14px',
  },
  select: {
    padding: '10px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '14px',
  },
  saveBtn: {
    padding: '10px 20px', background: '#34d399', color: '#0f172a',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' },
  card: {
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    border: '1px solid #334155',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px',
  },
  typeBadge: {
    padding: '2px 8px', background: '#818cf822', color: '#818cf8',
    borderRadius: '4px', fontSize: '12px', fontWeight: 500,
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
    padding: '12px 0', borderTop: '1px solid #334155', borderBottom: '1px solid #334155',
  },
  statusRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '12px',
  },
  statusBadge: {
    padding: '4px 10px', borderRadius: '4px', fontSize: '12px',
    fontWeight: 500, textTransform: 'capitalize',
  },
  empty: {
    textAlign: 'center', padding: '60px', background: '#1e293b',
    borderRadius: '12px', border: '1px solid #334155',
  },
};
