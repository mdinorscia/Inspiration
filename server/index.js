import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { initDb, getLeads, updateLead, deleteLead, getStats, scoreLeads, insertLeads, logActivity, getActivity, getPriorities, createPriority, updatePriority, deletePriority, movePriority } from './db.js';

config();

const app = express();
app.use(cors());
app.use(express.json());

const db = initDb();

// --- Stats ---
app.get('/api/stats', (req, res) => {
  res.json(getStats(db));
});

// --- Leads ---
app.get('/api/leads', (req, res) => {
  const { status, minScore, location, sortBy, order, limit, offset } = req.query;
  const leads = getLeads(db, {
    status,
    minScore: minScore ? Number(minScore) : undefined,
    location,
    sortBy,
    order,
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
  });
  res.json(leads);
});

app.put('/api/leads/:id', (req, res) => {
  const lead = updateLead(db, Number(req.params.id), req.body);
  if (lead) {
    logActivity(db, lead.id, 'updated', JSON.stringify(req.body));
    res.json(lead);
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  deleteLead(db, Number(req.params.id));
  res.json({ success: true });
});

app.get('/api/leads/:id/activity', (req, res) => {
  const activity = getActivity(db, Number(req.params.id));
  res.json(activity);
});

// --- Scoring ---
app.post('/api/leads/score', (req, res) => {
  const count = scoreLeads(db, req.body.weights);
  res.json({ scored: count });
});

// --- Bulk status update ---
app.post('/api/leads/bulk-status', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'ids (array) and status required' });
  }
  for (const id of ids) {
    updateLead(db, id, { status });
  }
  res.json({ updated: ids.length });
});

// --- CSV Import ---
app.post('/api/import/csv', express.text({ type: '*/*', limit: '50mb' }), (req, res) => {
  try {
    const records = parse(req.body, { columns: true, skip_empty_lines: true, trim: true });
    const leads = records.map(r => ({
      address: r.Address || r.address || r['Property Address'] || '',
      city: r.City || r.city || '',
      state: r.State || r.state || '',
      zip: r.Zip || r.zip || r['Zip Code'] || '',
      ownerName: r['Owner Name'] || r.ownerName || r.Owner || '',
      propertyType: r['Property Type'] || r.propertyType || '',
      bedrooms: r.Beds || r.bedrooms || null,
      bathrooms: r.Baths || r.bathrooms || null,
      sqft: r.SqFt || r.sqft || null,
      yearBuilt: r['Year Built'] || r.yearBuilt || null,
      estimatedValue: r['Estimated Value'] || r.estimatedValue || null,
      equity: r.Equity || r.equity || null,
      equityPercent: r['Equity %'] || r.equityPercent || null,
      lastSalePrice: r['Last Sale Price'] || r.lastSalePrice || null,
      lastSaleDate: r['Last Sale Date'] || r.lastSaleDate || '',
      isAbsentee: ['yes', 'true', '1', 'y'].includes((r.Absentee || r.isAbsentee || '').toLowerCase()),
      isVacant: ['yes', 'true', '1', 'y'].includes((r.Vacant || r.isVacant || '').toLowerCase()),
      isTaxDelinquent: ['yes', 'true', '1', 'y'].includes((r['Tax Delinquent'] || r.isTaxDelinquent || '').toLowerCase()),
      yearsOwned: r['Years Owned'] || r.yearsOwned || null,
      mailingAddress: r['Mailing Address'] || r.mailingAddress || '',
      phone: r.Phone || r.phone || '',
      email: r.Email || r.email || '',
      searchLocation: 'csv-import',
      scrapedAt: new Date().toISOString(),
      status: 'new',
      score: null,
    }));

    insertLeads(db, leads);
    res.json({ imported: leads.length });
  } catch (err) {
    res.status(400).json({ error: 'Failed to parse CSV: ' + err.message });
  }
});

// --- CSV Export ---
app.get('/api/export/csv', (req, res) => {
  const leads = getLeads(db, { limit: 10000 });
  const csv = stringify(leads, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=propstream-leads.csv');
  res.send(csv);
});

// --- Campaigns ---
app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const { name, type } = req.body;
  const result = db.prepare('INSERT INTO campaigns (name, type) VALUES (?, ?)').run(name, type);
  res.json({ id: result.lastInsertRowid, name, type, status: 'draft' });
});

// --- Priorities (Command Center) ---
app.get('/api/priorities', (req, res) => {
  res.json(getPriorities(db));
});

app.post('/api/priorities', (req, res) => {
  const { title, section } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const priority = createPriority(db, { title, section });
  res.json(priority);
});

app.put('/api/priorities/:id', (req, res) => {
  const priority = updatePriority(db, Number(req.params.id), req.body);
  if (priority) {
    res.json(priority);
  } else {
    res.status(404).json({ error: 'Priority not found' });
  }
});

app.delete('/api/priorities/:id', (req, res) => {
  deletePriority(db, Number(req.params.id));
  res.json({ success: true });
});

app.post('/api/priorities/:id/move', (req, res) => {
  const { section } = req.body;
  if (!section) return res.status(400).json({ error: 'section is required' });
  const priority = movePriority(db, Number(req.params.id), section);
  if (priority) {
    res.json(priority);
  } else {
    res.status(400).json({ error: 'Invalid section. Use: carried_forward, daily, weekly' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Lead Generator API running on http://localhost:${PORT}`);
});
