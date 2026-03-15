import { useState } from 'react';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import LeadDetail from './components/LeadDetail';
import ImportExport from './components/ImportExport';
import Campaigns from './components/Campaigns';
import Settings from './components/Settings';

const TABS = ['Dashboard', 'Leads', 'Campaigns', 'Import/Export', 'Settings'];

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [selectedLead, setSelectedLead] = useState(null);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>PropStream Lead Generator</h1>
        <p style={styles.subtitle}>Off-Market & Motivated Seller Pipeline</p>
      </header>

      <nav style={styles.nav}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedLead(null); }}
            style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}
          >
            {t}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {tab === 'Dashboard' && <Dashboard onViewLeads={() => setTab('Leads')} />}
        {tab === 'Leads' && !selectedLead && (
          <LeadTable onSelect={setSelectedLead} />
        )}
        {tab === 'Leads' && selectedLead && (
          <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} />
        )}
        {tab === 'Campaigns' && <Campaigns />}
        {tab === 'Import/Export' && <ImportExport />}
        {tab === 'Settings' && <Settings />}
      </main>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
  },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    padding: '24px 32px',
    borderBottom: '1px solid #334155',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#94a3b8',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    padding: '12px 32px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
  },
  navBtn: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    background: '#334155',
    color: '#f1f5f9',
    fontWeight: 600,
  },
  main: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
};
