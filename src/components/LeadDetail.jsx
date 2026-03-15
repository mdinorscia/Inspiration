import { useState, useEffect } from 'react';
import { api } from '../api';

export default function LeadDetail({ lead: initialLead, onBack }) {
  const [lead, setLead] = useState(initialLead);
  const [notes, setNotes] = useState(initialLead.notes || '');
  const [activity, setActivity] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getActivity(lead.id).then(setActivity).catch(() => {});
  }, [lead.id]);

  const updateField = async (field, value) => {
    setSaving(true);
    const updated = await api.updateLead(lead.id, { [field]: value });
    setLead(updated);
    setSaving(false);
  };

  const saveNotes = async () => {
    await updateField('notes', notes);
  };

  const getScoreColor = (score) => {
    if (score == null) return '#64748b';
    if (score >= 70) return '#f87171';
    if (score >= 40) return '#fbbf24';
    return '#34d399';
  };

  return (
    <div>
      <button onClick={onBack} style={styles.backBtn}>Back to Leads</button>

      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px' }}>{lead.address || 'No Address'}</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>
            {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '36px', fontWeight: 700,
            color: getScoreColor(lead.score),
          }}>
            {lead.score ?? '—'}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lead Score</div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Property Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Property Details</h3>
          <InfoRow label="Owner" value={lead.owner_name} />
          <InfoRow label="Property Type" value={lead.property_type} />
          <InfoRow label="Beds/Baths" value={lead.bedrooms || lead.bathrooms ? `${lead.bedrooms || '—'} / ${lead.bathrooms || '—'}` : null} />
          <InfoRow label="SqFt" value={lead.sqft ? Number(lead.sqft).toLocaleString() : null} />
          <InfoRow label="Year Built" value={lead.year_built} />
          <InfoRow label="Est. Value" value={lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : null} />
          <InfoRow label="Equity" value={lead.equity ? `$${Number(lead.equity).toLocaleString()}` : null} />
          <InfoRow label="Equity %" value={lead.equity_percent ? `${lead.equity_percent}%` : null} />
          <InfoRow label="Last Sale" value={lead.last_sale_price ? `$${Number(lead.last_sale_price).toLocaleString()} (${lead.last_sale_date})` : null} />
          <InfoRow label="Years Owned" value={lead.years_owned} />
        </div>

        {/* Motivation Indicators */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Motivation Indicators</h3>
          <Indicator label="Absentee Owner" active={lead.is_absentee === 1} />
          <Indicator label="Vacant Property" active={lead.is_vacant === 1} />
          <Indicator label="Tax Delinquent" active={lead.is_tax_delinquent === 1} />
          <Indicator label="High Equity" active={lead.equity_percent >= 50} />
          <Indicator label="Long-Term Owner (10+ yrs)" active={lead.years_owned >= 10} />
        </div>

        {/* Contact Info */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Contact Information</h3>
          <InfoRow label="Mailing Address" value={lead.mailing_address} />
          <div style={styles.contactRow}>
            <label style={styles.contactLabel}>Phone:</label>
            <input
              style={styles.contactInput}
              value={lead.phone || ''}
              onChange={e => setLead(l => ({ ...l, phone: e.target.value }))}
              onBlur={e => updateField('phone', e.target.value)}
              placeholder="Add phone number"
            />
          </div>
          <div style={styles.contactRow}>
            <label style={styles.contactLabel}>Email:</label>
            <input
              style={styles.contactInput}
              value={lead.email || ''}
              onChange={e => setLead(l => ({ ...l, email: e.target.value }))}
              onBlur={e => updateField('email', e.target.value)}
              placeholder="Add email"
            />
          </div>
        </div>

        {/* Status & Pipeline */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Pipeline Status</h3>
          <select
            value={lead.status}
            onChange={e => updateField('status', e.target.value)}
            style={styles.statusSelect}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="negotiating">Negotiating</option>
            <option value="closed">Closed</option>
            <option value="dead">Dead</option>
          </select>

          {saving && <span style={{ fontSize: '12px', color: '#38bdf8' }}>Saving...</span>}
        </div>
      </div>

      {/* Notes */}
      <div style={{ ...styles.card, marginTop: '16px' }}>
        <h3 style={styles.cardTitle}>Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes about this lead..."
          style={styles.textarea}
          rows={4}
        />
        <button onClick={saveNotes} style={styles.saveBtn}>Save Notes</button>
      </div>

      {/* Activity Log */}
      {activity.length > 0 && (
        <div style={{ ...styles.card, marginTop: '16px' }}>
          <h3 style={styles.cardTitle}>Activity Log</h3>
          {activity.map(a => (
            <div key={a.id} style={styles.activityItem}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(a.created_at).toLocaleString()}</span>
              <span style={{ fontWeight: 500 }}>{a.action}</span>
              {a.details && <span style={{ color: '#64748b', fontSize: '13px' }}>{a.details}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

function Indicator({ label, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: active ? '#34d399' : '#334155',
      }} />
      <span style={{ color: active ? '#e2e8f0' : '#64748b', fontSize: '14px' }}>{label}</span>
    </div>
  );
}

const styles = {
  backBtn: {
    padding: '8px 16px', background: '#334155', border: 'none',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer',
    marginBottom: '16px',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1e293b', borderRadius: '12px', padding: '24px',
    border: '1px solid #334155', marginBottom: '16px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' },
  card: {
    background: '#1e293b', borderRadius: '12px', padding: '20px',
    border: '1px solid #334155',
  },
  cardTitle: { margin: '0 0 12px', fontSize: '16px', fontWeight: 600 },
  contactRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  contactLabel: { fontSize: '13px', color: '#94a3b8', width: '60px' },
  contactInput: {
    flex: 1, padding: '6px 10px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px',
  },
  statusSelect: {
    width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '14px',
  },
  textarea: {
    width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155',
    borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'inherit',
    resize: 'vertical', boxSizing: 'border-box',
  },
  saveBtn: {
    marginTop: '8px', padding: '8px 16px', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  activityItem: {
    display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
};
