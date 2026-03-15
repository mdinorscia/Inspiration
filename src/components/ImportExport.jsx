import { useState, useRef } from 'react';
import { api } from '../api';

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const res = await api.importCsv(text);
      const data = await res.json();
      setResult({ success: true, message: `Successfully imported ${data.imported} leads` });
    } catch (err) {
      setResult({ success: false, message: `Import failed: ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Import & Export Leads</h2>

      <div style={styles.grid}>
        {/* Import */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Import from CSV</h3>
          <p style={styles.desc}>
            Upload a CSV export from PropStream. The system will map common column names
            automatically (Address, Owner Name, Estimated Value, Equity, etc.)
          </p>

          <div style={styles.uploadArea}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={styles.fileInput}
              onChange={() => setResult(null)}
            />
            <button
              onClick={handleImport}
              disabled={importing}
              style={styles.importBtn}
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>

          {result && (
            <div style={{
              ...styles.result,
              background: result.success ? '#34d39922' : '#f8717122',
              color: result.success ? '#34d399' : '#f87171',
            }}>
              {result.message}
            </div>
          )}

          <div style={styles.hint}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#94a3b8' }}>Supported Column Names</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              Address, City, State, Zip, Owner Name, Property Type, Beds, Baths, SqFt,
              Year Built, Estimated Value, Equity, Equity %, Last Sale Price, Last Sale Date,
              Absentee, Vacant, Tax Delinquent, Years Owned, Mailing Address, Phone, Email
            </p>
          </div>
        </div>

        {/* Export */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Export Leads</h3>
          <p style={styles.desc}>
            Download all your leads as a CSV file for use in other tools, mail campaigns, or CRM imports.
          </p>
          <a href={api.exportCsv()} download style={styles.exportBtn}>
            Download CSV Export
          </a>
        </div>
      </div>

      {/* Scraper Instructions */}
      <div style={{ ...styles.card, marginTop: '16px' }}>
        <h3 style={styles.cardTitle}>Automated Scraping</h3>
        <p style={styles.desc}>
          Use the built-in PropStream scraper to automatically pull leads:
        </p>
        <div style={styles.codeBlock}>
          <code>
            # 1. Copy .env.example to .env and add your PropStream credentials{'\n'}
            cp .env.example .env{'\n\n'}
            # 2. Set your target locations in .env{'\n'}
            # DEFAULT_LOCATIONS=90210,90211,Beverly Hills CA{'\n\n'}
            # 3. Run the scraper{'\n'}
            npm run scrape
          </code>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' },
  card: {
    background: '#1e293b', borderRadius: '12px', padding: '24px',
    border: '1px solid #334155',
  },
  cardTitle: { margin: '0 0 8px', fontSize: '18px', fontWeight: 600 },
  desc: { margin: '0 0 16px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' },
  uploadArea: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' },
  fileInput: { flex: 1, fontSize: '13px', color: '#94a3b8' },
  importBtn: {
    padding: '10px 20px', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
  },
  exportBtn: {
    display: 'inline-block', padding: '10px 20px', background: '#818cf8', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
    cursor: 'pointer', textDecoration: 'none',
  },
  result: {
    padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px',
  },
  hint: {
    background: '#0f172a', borderRadius: '8px', padding: '16px',
    border: '1px solid #334155',
  },
  codeBlock: {
    background: '#0f172a', borderRadius: '8px', padding: '16px',
    border: '1px solid #334155', fontFamily: 'monospace', fontSize: '13px',
    color: '#38bdf8', whiteSpace: 'pre', overflowX: 'auto',
  },
};
