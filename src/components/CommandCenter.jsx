import { useState, useEffect } from 'react';
import { api } from '../api';

const SECTIONS = [
  { key: 'carried_forward', label: 'Carried Forward', color: '#f87171' },
  { key: 'daily', label: 'Daily Priorities', color: '#38bdf8' },
  { key: 'weekly', label: 'Weekly Priorities', color: '#818cf8' },
];

const MOVE_OPTIONS = {
  carried_forward: [
    { key: 'daily', label: 'Move to Daily' },
    { key: 'weekly', label: 'Move to Weekly' },
  ],
  daily: [
    { key: 'weekly', label: 'Move to Weekly' },
    { key: 'carried_forward', label: 'Move to Carried Forward' },
  ],
  weekly: [
    { key: 'daily', label: 'Move to Daily' },
    { key: 'carried_forward', label: 'Move to Carried Forward' },
  ],
};

export default function CommandCenter() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ title: '', section: 'daily' });
  const [moving, setMoving] = useState(null); // id of item showing move menu

  const fetchPriorities = () => {
    api.getPriorities()
      .then(setPriorities)
      .catch(() => setPriorities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPriorities(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    await api.createPriority(newItem.title.trim(), newItem.section);
    setNewItem({ title: '', section: 'daily' });
    fetchPriorities();
  };

  const handleMove = async (id, newSection) => {
    await api.movePriority(id, newSection);
    setMoving(null);
    fetchPriorities();
  };

  const handleToggleComplete = async (item) => {
    await api.updatePriority(item.id, { completed: item.completed ? 0 : 1 });
    fetchPriorities();
  };

  const handleDelete = async (id) => {
    await api.deletePriority(id);
    fetchPriorities();
  };

  if (loading) return <p style={{ color: '#94a3b8' }}>Loading command center...</p>;

  const grouped = {
    carried_forward: priorities.filter(p => p.section === 'carried_forward'),
    daily: priorities.filter(p => p.section === 'daily'),
    weekly: priorities.filter(p => p.section === 'weekly'),
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Command Center</h2>

      {/* Add new priority */}
      <form onSubmit={handleAdd} style={styles.addForm}>
        <input
          type="text"
          placeholder="New priority..."
          value={newItem.title}
          onChange={e => setNewItem({ ...newItem, title: e.target.value })}
          style={styles.input}
        />
        <select
          value={newItem.section}
          onChange={e => setNewItem({ ...newItem, section: e.target.value })}
          style={styles.select}
        >
          {SECTIONS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button type="submit" style={styles.addBtn}>Add</button>
      </form>

      {/* Priority Sections */}
      <div style={styles.sectionsGrid}>
        {SECTIONS.map(section => (
          <div key={section.key} style={styles.sectionCard}>
            <div style={{ ...styles.sectionHeader, borderLeftColor: section.color }}>
              <h3 style={styles.sectionTitle}>{section.label}</h3>
              <span style={{ ...styles.badge, background: section.color }}>
                {grouped[section.key].length}
              </span>
            </div>

            {grouped[section.key].length === 0 ? (
              <p style={styles.emptyText}>No items</p>
            ) : (
              <ul style={styles.list}>
                {grouped[section.key].map(item => (
                  <li key={item.id} style={styles.listItem}>
                    <div style={styles.itemRow}>
                      <button
                        onClick={() => handleToggleComplete(item)}
                        style={{
                          ...styles.checkbox,
                          background: item.completed ? section.color : 'transparent',
                          borderColor: item.completed ? section.color : '#475569',
                        }}
                        title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {item.completed ? '\u2713' : ''}
                      </button>
                      <span style={{
                        ...styles.itemText,
                        textDecoration: item.completed ? 'line-through' : 'none',
                        opacity: item.completed ? 0.5 : 1,
                      }}>
                        {item.title}
                      </span>
                      <div style={styles.itemActions}>
                        <button
                          onClick={() => setMoving(moving === item.id ? null : item.id)}
                          style={styles.moveBtn}
                          title="Move to another section"
                        >
                          &#8596;
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={styles.deleteBtn}
                          title="Delete"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    {moving === item.id && (
                      <div style={styles.moveMenu}>
                        {MOVE_OPTIONS[section.key].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => handleMove(item.id, opt.key)}
                            style={styles.moveOption}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  addForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '10px 14px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '10px 20px',
    background: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  sectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  sectionCard: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #334155',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingLeft: '12px',
    borderLeft: '3px solid',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
  },
  badge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
  },
  emptyText: {
    color: '#475569',
    fontSize: '13px',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '16px 0',
    margin: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: '8px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  checkbox: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: '14px',
    color: '#e2e8f0',
  },
  itemActions: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  moveBtn: {
    width: '28px',
    height: '28px',
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: '28px',
    height: '28px',
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    color: '#f87171',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveMenu: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    padding: '8px 12px',
    background: '#334155',
    borderRadius: '8px',
  },
  moveOption: {
    padding: '6px 14px',
    background: '#475569',
    border: 'none',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
