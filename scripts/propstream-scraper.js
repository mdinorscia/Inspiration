import puppeteer from 'puppeteer-core';
import { config } from 'dotenv';
import { initDb, insertLeads } from '../server/db.js';

config();

import fs from 'fs';

// Auto-detect Chrome/Chromium path on common OS locations
function findBrowserPath() {
  const paths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch { /* skip */ }
  }
  return null;
}

const PROPSTREAM_URL = 'https://app.propstream.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
  console.log('[PropStream] Navigating to login...');
  await page.goto(`${PROPSTREAM_URL}/login`, { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 15000 });

  // Find and fill email field
  const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email'];
  for (const sel of emailSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click({ clickCount: 3 });
      await el.type(process.env.PROPSTREAM_EMAIL, { delay: 50 });
      break;
    }
  }

  // Find and fill password field
  const passSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
  for (const sel of passSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click({ clickCount: 3 });
      await el.type(process.env.PROPSTREAM_PASSWORD, { delay: 50 });
      break;
    }
  }

  // Click login button
  const loginBtn = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Sign In")');
  if (loginBtn) {
    await loginBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  console.log('[PropStream] Logged in successfully');
}

async function navigateToSearch(page) {
  console.log('[PropStream] Navigating to property search...');

  // Try common navigation patterns for PropStream
  const searchSelectors = [
    'a[href*="search"]',
    'a[href*="property"]',
    '[data-testid="search"]',
    'button:has-text("Search")',
    'a:has-text("Search")',
  ];

  for (const sel of searchSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await delay(2000);
      break;
    }
  }
}

async function applyMotivatedSellerFilters(page) {
  console.log('[PropStream] Applying motivated seller filters...');

  // PropStream filter categories for off-market motivated sellers
  const filterActions = [
    // Absentee owners
    { label: 'Absentee Owner', selectors: ['[data-filter="absentee"]', 'label:has-text("Absentee")', 'input[name*="absentee"]'] },
    // High equity
    { label: 'High Equity', selectors: ['[data-filter="equity"]', 'label:has-text("Equity")', 'input[name*="equity"]'] },
    // Vacant properties
    { label: 'Vacant', selectors: ['[data-filter="vacant"]', 'label:has-text("Vacant")', 'input[name*="vacant"]'] },
    // Tired landlord (owned 10+ years)
    { label: 'Years Owned', selectors: ['[data-filter="yearsOwned"]', 'label:has-text("Years Owned")', 'input[name*="years"]'] },
    // Tax delinquent
    { label: 'Tax Delinquent', selectors: ['[data-filter="tax"]', 'label:has-text("Tax")', 'input[name*="tax"]'] },
  ];

  for (const filter of filterActions) {
    for (const sel of filter.selectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click();
          console.log(`  [Filter] Applied: ${filter.label}`);
          await delay(500);
          break;
        }
      } catch {
        // Selector not found, try next
      }
    }
  }
}

async function searchLocation(page, location) {
  console.log(`[PropStream] Searching location: ${location}`);

  const searchInputSelectors = [
    'input[placeholder*="search"]',
    'input[placeholder*="location"]',
    'input[placeholder*="address"]',
    'input[placeholder*="zip"]',
    'input[type="search"]',
    '#searchInput',
  ];

  for (const sel of searchInputSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click({ clickCount: 3 });
      await el.type(location, { delay: 30 });
      await page.keyboard.press('Enter');
      await delay(3000);
      break;
    }
  }
}

function parsePropertyValue(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.]/g, '');
  return cleaned ? parseFloat(cleaned) : null;
}

async function extractLeads(page) {
  console.log('[PropStream] Extracting lead data...');

  // Wait for results to load
  await delay(2000);

  const leads = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr[data-row], .property-card, .result-item, table tbody tr');
    const results = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td, .cell, .field');
      const getText = (el) => el ? el.textContent.trim() : '';

      // Try to extract common property data fields
      const lead = {
        address: '',
        city: '',
        state: '',
        zip: '',
        ownerName: '',
        propertyType: '',
        bedrooms: null,
        bathrooms: null,
        sqft: null,
        yearBuilt: null,
        estimatedValue: null,
        equity: null,
        equityPercent: null,
        lastSalePrice: null,
        lastSaleDate: '',
        isAbsentee: false,
        isVacant: false,
        isTaxDelinquent: false,
        yearsOwned: null,
        mailingAddress: '',
        phone: '',
        email: '',
      };

      // Extract from table cells or card elements
      if (cells.length > 0) {
        lead.address = getText(cells[0]);
        lead.ownerName = getText(cells[1]);
        if (cells[2]) lead.estimatedValue = getText(cells[2]);
        if (cells[3]) lead.equity = getText(cells[3]);
      }

      // Try data attributes
      const dataFields = row.querySelectorAll('[data-field]');
      dataFields.forEach(field => {
        const key = field.getAttribute('data-field');
        const val = getText(field);
        if (key in lead) {
          lead[key] = val;
        }
      });

      // Check for indicator badges/tags
      const badges = row.querySelectorAll('.badge, .tag, .indicator, .label');
      badges.forEach(badge => {
        const text = getText(badge).toLowerCase();
        if (text.includes('absentee')) lead.isAbsentee = true;
        if (text.includes('vacant')) lead.isVacant = true;
        if (text.includes('tax')) lead.isTaxDelinquent = true;
      });

      if (lead.address || lead.ownerName) {
        results.push(lead);
      }
    });

    return results;
  });

  console.log(`[PropStream] Extracted ${leads.length} leads`);
  return leads;
}

async function scrapeAllPages(page, maxPages = 10) {
  const allLeads = [];

  for (let i = 0; i < maxPages; i++) {
    const leads = await extractLeads(page);
    if (leads.length === 0) break;

    allLeads.push(...leads);
    console.log(`[PropStream] Page ${i + 1}: ${leads.length} leads (total: ${allLeads.length})`);

    // Try to go to next page
    const nextBtn = await page.$('button:has-text("Next"), a:has-text("Next"), .pagination-next, [aria-label="Next"]');
    if (!nextBtn) break;

    await nextBtn.click();
    await delay(3000);
  }

  return allLeads;
}

async function exportFromPropStream(page) {
  console.log('[PropStream] Attempting CSV export from PropStream...');

  const exportSelectors = [
    'button:has-text("Export")',
    'button:has-text("Download")',
    'a:has-text("Export")',
    '[data-action="export"]',
    '.export-btn',
  ];

  for (const sel of exportSelectors) {
    const el = await page.$(sel);
    if (el) {
      await el.click();
      await delay(2000);

      // Select CSV if options appear
      const csvOption = await page.$('button:has-text("CSV"), a:has-text("CSV"), label:has-text("CSV")');
      if (csvOption) await csvOption.click();

      console.log('[PropStream] Export initiated');
      return true;
    }
  }

  console.log('[PropStream] Export button not found, using scraped data');
  return false;
}

async function run() {
  const locations = (process.env.DEFAULT_LOCATIONS || '90210').split(',').map(l => l.trim());

  console.log('=== PropStream Lead Generator ===');
  console.log(`Locations: ${locations.join(', ')}`);
  console.log(`Target: Off-Market / Motivated Sellers`);
  console.log('');

  // Initialize database
  const db = initDb();

  // Find Chrome/Chromium on your system
  const executablePath = process.env.CHROME_PATH || findBrowserPath();
  if (!executablePath) {
    console.error('Chrome/Chromium not found. Install Google Chrome or set CHROME_PATH in .env');
    console.error('Download Chrome: https://www.google.com/chrome/');
    process.exit(1);
  }
  console.log(`[Browser] Using: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: false, // Set to true for production
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Login
    await login(page);
    await delay(2000);

    // Navigate to search
    await navigateToSearch(page);
    await delay(2000);

    // Apply motivated seller filters
    await applyMotivatedSellerFilters(page);
    await delay(1000);

    let totalLeads = 0;

    for (const location of locations) {
      console.log(`\n--- Processing: ${location} ---`);

      await searchLocation(page, location);
      await delay(3000);

      // Try exporting first (PropStream's built-in export)
      const exported = await exportFromPropStream(page);

      // Also scrape visible data
      const leads = await scrapeAllPages(page);

      if (leads.length > 0) {
        // Add location metadata and timestamp
        const enrichedLeads = leads.map(lead => ({
          ...lead,
          searchLocation: location,
          scrapedAt: new Date().toISOString(),
          status: 'new',
          score: null,
        }));

        insertLeads(db, enrichedLeads);
        totalLeads += leads.length;
        console.log(`Saved ${leads.length} leads from ${location}`);
      }
    }

    console.log(`\n=== Complete: ${totalLeads} total leads saved ===`);
  } catch (error) {
    console.error('[PropStream] Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
