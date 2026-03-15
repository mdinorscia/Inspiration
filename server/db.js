import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'leads.db');

export function initDb() {
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      owner_name TEXT,
      property_type TEXT,
      bedrooms INTEGER,
      bathrooms INTEGER,
      sqft INTEGER,
      year_built INTEGER,
      estimated_value REAL,
      equity REAL,
      equity_percent REAL,
      last_sale_price REAL,
      last_sale_date TEXT,
      is_absentee INTEGER DEFAULT 0,
      is_vacant INTEGER DEFAULT 0,
      is_tax_delinquent INTEGER DEFAULT 0,
      years_owned INTEGER,
      mailing_address TEXT,
      phone TEXT,
      email TEXT,
      search_location TEXT,
      scraped_at TEXT,
      status TEXT DEFAULT 'new',
      score REAL,
      notes TEXT,
      campaign TEXT,
      contacted_at TEXT,
      response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      lead_count INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      response_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
    CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(search_location);
  `);

  return db;
}

export function insertLeads(db, leads) {
  const insert = db.prepare(`
    INSERT INTO leads (
      address, city, state, zip, owner_name, property_type,
      bedrooms, bathrooms, sqft, year_built,
      estimated_value, equity, equity_percent,
      last_sale_price, last_sale_date,
      is_absentee, is_vacant, is_tax_delinquent, years_owned,
      mailing_address, phone, email,
      search_location, scraped_at, status, score
    ) VALUES (
      @address, @city, @state, @zip, @ownerName, @propertyType,
      @bedrooms, @bathrooms, @sqft, @yearBuilt,
      @estimatedValue, @equity, @equityPercent,
      @lastSalePrice, @lastSaleDate,
      @isAbsentee, @isVacant, @isTaxDelinquent, @yearsOwned,
      @mailingAddress, @phone, @email,
      @searchLocation, @scrapedAt, @status, @score
    )
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        address: item.address || null,
        city: item.city || null,
        state: item.state || null,
        zip: item.zip || null,
        ownerName: item.ownerName || null,
        propertyType: item.propertyType || null,
        bedrooms: item.bedrooms || null,
        bathrooms: item.bathrooms || null,
        sqft: item.sqft || null,
        yearBuilt: item.yearBuilt || null,
        estimatedValue: item.estimatedValue || null,
        equity: item.equity || null,
        equityPercent: item.equityPercent || null,
        lastSalePrice: item.lastSalePrice || null,
        lastSaleDate: item.lastSaleDate || null,
        isAbsentee: item.isAbsentee ? 1 : 0,
        isVacant: item.isVacant ? 1 : 0,
        isTaxDelinquent: item.isTaxDelinquent ? 1 : 0,
        yearsOwned: item.yearsOwned || null,
        mailingAddress: item.mailingAddress || null,
        phone: item.phone || null,
        email: item.email || null,
        searchLocation: item.searchLocation || null,
        scrapedAt: item.scrapedAt || null,
        status: item.status || 'new',
        score: item.score || null,
      });
    }
  });

  insertMany(leads);
}

export function getLeads(db, { status, minScore, location, sortBy, order, limit, offset } = {}) {
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = {};

  if (status && status !== 'all') {
    query += ' AND status = @status';
    params.status = status;
  }
  if (minScore != null) {
    query += ' AND score >= @minScore';
    params.minScore = minScore;
  }
  if (location) {
    query += ' AND search_location = @location';
    params.location = location;
  }

  const validSortColumns = ['score', 'estimated_value', 'equity', 'created_at', 'status'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${sortOrder}`;

  if (limit) {
    query += ' LIMIT @limit';
    params.limit = limit;
  }
  if (offset) {
    query += ' OFFSET @offset';
    params.offset = offset;
  }

  return db.prepare(query).all(params);
}

export function updateLead(db, id, updates) {
  const allowed = ['status', 'score', 'notes', 'campaign', 'contacted_at', 'response', 'phone', 'email'];
  const setClauses = [];
  const params = { id };

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = @${key}`);
      params[key] = value;
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push("updated_at = datetime('now')");
  const query = `UPDATE leads SET ${setClauses.join(', ')} WHERE id = @id`;
  db.prepare(query).run(params);

  return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}

export function deleteLead(db, id) {
  return db.prepare('DELETE FROM leads WHERE id = ?').run(id);
}

export function getStats(db) {
  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM leads WHERE score IS NOT NULL').get();
  const byLocation = db.prepare('SELECT search_location, COUNT(*) as count FROM leads GROUP BY search_location').all();
  const hotLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE score >= 70').get();

  return {
    total: total.count,
    byStatus: Object.fromEntries(byStatus.map(r => [r.status, r.count])),
    avgScore: avgScore.avg ? Math.round(avgScore.avg) : 0,
    byLocation: Object.fromEntries(byLocation.map(r => [r.search_location, r.count])),
    hotLeads: hotLeads.count,
  };
}

export function scoreLeads(db, weights = {}) {
  const w = {
    equity: weights.equity ?? 0.3,
    absentee: weights.absentee ?? 0.2,
    vacant: weights.vacant ?? 0.2,
    yearsOwned: weights.yearsOwned ?? 0.15,
    taxDelinquent: weights.taxDelinquent ?? 0.15,
  };

  const leads = db.prepare('SELECT * FROM leads WHERE score IS NULL OR score = 0').all();
  const update = db.prepare('UPDATE leads SET score = @score, updated_at = datetime(\'now\') WHERE id = @id');

  const scoreMany = db.transaction((items) => {
    for (const lead of items) {
      let score = 0;

      // Equity score (higher equity = higher score)
      if (lead.equity_percent) {
        score += (Math.min(lead.equity_percent, 100) / 100) * w.equity * 100;
      } else if (lead.equity && lead.estimated_value && lead.estimated_value > 0) {
        const pct = (lead.equity / lead.estimated_value) * 100;
        score += (Math.min(pct, 100) / 100) * w.equity * 100;
      }

      // Absentee owner bonus
      if (lead.is_absentee) score += w.absentee * 100;

      // Vacant property bonus
      if (lead.is_vacant) score += w.vacant * 100;

      // Years owned (longer = more motivated)
      if (lead.years_owned) {
        const yearsFactor = Math.min(lead.years_owned / 20, 1);
        score += yearsFactor * w.yearsOwned * 100;
      }

      // Tax delinquent bonus
      if (lead.is_tax_delinquent) score += w.taxDelinquent * 100;

      score = Math.round(Math.min(score, 100));

      update.run({ score, id: lead.id });
    }
  });

  scoreMany(leads);
  return leads.length;
}

export function logActivity(db, leadId, action, details) {
  db.prepare('INSERT INTO activity_log (lead_id, action, details) VALUES (?, ?, ?)').run(leadId, action, details);
}

export function getActivity(db, leadId) {
  return db.prepare('SELECT * FROM activity_log WHERE lead_id = ? ORDER BY created_at DESC').all(leadId);
}
