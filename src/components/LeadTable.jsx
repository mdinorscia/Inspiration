import { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_OPTIONS = ['all', 'new', 'contacted', 'qualified', 'negotiating', 'closed', 'dead'];

export default function LeadTable({ onSelect }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', sortBy: 'score', order: 'DESC' });
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchLeads = () => {
    setLoading(true);
    api.getLeads({
      ...filters,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [filters, page]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map(l => l.id)));
  };

  const bulkUpdateStatus = async (status) => {
    if (selected.size === 0) return;
    await api.bulkStatus([...selected], status);
    setSelected(new Set());
    fetchLeads();
  };

  const handleScoreAll = async () => {
    await api.scoreLeads();
    fetchLeads();
  };

  const getScoreColor = (score) => {
    if (score == null) return '#64748b';
    if (score >= 70) return '#f87171';
    if (score >= 40) return '#fbbf24';
    return '#34d399';
  };

  const getScoreLabel = (score) => {
    if (score == null) return 'Unscored';
    if (score >= 70) return 'Hot';
    if (score >= 40) return 'Warm';
    return 'Cool';
  };

  return (
    <div>
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status:</label>
          <select
            value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(0); }}
            style={styles.select}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label style={styles.filterLabel}>Sort:</label>
          <select
            value={filters.sortBy}
            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
            style={styles.select}
          >
            <option value="score">Score</option>
            <option value="estimated_value">Value</option>
            <option value="equity">Equity</option>
            <option value="created_at">Date Added</option>
          </select>

          <button
            onClick={() => setFilters(f => ({ ...f, order: f.order === 'DESC' ? 'ASC' : 'DESC' }))}
            style={styles.sortBtn}
          >
            {filters.order === 'DESC' ? 'Desc' : 'Asc'}
          </button>
        </div>

        <div style={styles.actions}>
          <button onClick={handleScoreAll} style={styles.actionBtn}>Score All Leads</button>
          {selected.size > 0 && (
            <>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>{selected.size} selected</span>
              <select onChange={e => bulkUpdateStatus(e.target.value)} style={styles.select} defaultValue="">
                <option value="" disabled>Set Status...</option>
                {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading leads...</p>
      ) : leads.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No leads found. Import from PropStream or run the scraper.</p>
        </div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input type="checkbox" checked={selected.size === leads.length && leads.length > 0} onChange={selectAll} />
                </th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Est. Value</th>
                <th style={styles.th}>Equity</th>
                <th style={styles.th}>Tags</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr
                  key={lead.id}
                  style={styles.row}
                  onClick={() => onSelect(lead)}
                >
                  <td style={styles.td} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} />
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.scoreBadge,
                      background: getScoreColor(lead.score) + '22',
                      color: getScoreColor(lead.score),
                      borderColor: getScoreColor(lead.score),
                    }}>
                      {lead.score ?? '—'} {getScoreLabel(lead.score)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 500 }}>{lead.address || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td style={styles.td}>{lead.owner_name || '—'}</td>
                  <td style={styles.td}>{lead.estimated_value ? `$${Number(lead.estimated_value).toLocaleString()}` : '—'}</td>
                  <td style={styles.td}>{lead.equity ? `$${Number(lead.equity).toLocaleString()}` : '—'}</td>
                  <td style={styles.td}>
                    <div style={styles.tags}>
                      {lead.is_absentee === 1 && <span style={{ ...styles.tag, background: '#38bdf822', color: '#38bdf8' }}>Absentee</span>}
                      {lead.is_vacant === 1 && <span style={{ ...styles.tag, background: '#fbbf2422', color: '#fbbf24' }}>Vacant</span>}
                      {lead.is_tax_delinquent === 1 && <span style={{ ...styles.tag, background: '#f8717122', color: '#f87171' }}>Tax Delinq.</span>}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, textTransform: 'capitalize' }}>{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={styles.pageBtn}>Previous</button>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Page {page + 1}</span>
            <button disabled={leads.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)} style={styles.pageBtn}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px', flexWrap: 'wrap', gap: '12px',
  },
  filterGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  filterLabel: { fontSize: '13px', color: '#94a3b8' },
  select: {
    padding: '6px 12px', background: '#1e293b', border: '1px solid #334155',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px',
  },
  sortBtn: {
    padding: '6px 12px', background: '#334155', border: 'none',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer',
  },
  actions: { display: 'flex', alignItems: 'center', gap: '8px' },
  actionBtn: {
    padding: '8px 16px', background: '#818cf8', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    background: '#1e293b', borderBottom: '1px solid #334155',
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: '14px' },
  row: { cursor: 'pointer', transition: 'background 0.15s' },
  scoreBadge: {
    padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
    fontWeight: 600, border: '1px solid', whiteSpace: 'nowrap',
  },
  tags: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  tag: { padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 },
  statusBadge: { padding: '2px 8px', background: '#334155', borderRadius: '4px', fontSize: '12px' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' },
  pageBtn: {
    padding: '6px 16px', background: '#334155', border: 'none',
    borderRadius: '6px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center', padding: '60px', background: '#1e293b',
    borderRadius: '12px', color: '#94a3b8',
  },
};
