# PropStream Lead Farming — RE Outreach
## n8n Workflow Import & Setup Guide

### Quick Start (5 minutes)

#### Step 1: Import the Workflow
1. Go to **dinorscia56.app.n8n.cloud**
2. Click **"Add workflow"** → **"Import from File"**
3. Select `PropStream-Lead-Farming-RE-Outreach.json`
4. The workflow will appear with all 12 nodes connected

#### Step 2: Connect Your Credentials (3 nodes need this)
After import, three nodes show a ⚠️ warning because credential IDs are placeholders.
Click each one and select your existing credential:

| Node | Credential to Select |
|------|---------------------|
| **Claude — Lead Scoring** | `Anthropic API` |
| **Claude — Outreach Copy** | `Anthropic API` |
| **Google Sheets — CRM Log** | `Google Sheets Account` |
| **Gmail — Summary Report** | `Gmail Account` |

#### Step 3: Set Up Google Sheet
1. Create a new Google Sheet named **"GGC Lead CRM"**
2. Create three tabs: `Phoenix_MF`, `SLC_MF`, `Heber_STR`
3. In each tab, add these column headers in Row 1:

```
Row Index | Market | Property Address | City | State | Zip | Owner Name |
Owner Mailing Address | Owner Mailing City | Owner Mailing State |
Owner Mailing Zip | Out of State | Phone | Email | Est. Value |
Est. Equity | Equity % | Beds | Sqft | Year Built | Last Sale Date |
Last Sale Amount | MLS Status | Foreclosure Factor | Lead Score |
Lead Tier | Score Reasoning | Est. ARV | Offer % | Red Flags |
Opportunity Notes | Letter Subject | SMS Template | Email Subject |
Processed At
```

4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
5. In n8n, open **"Google Sheets — CRM Log"** node and paste the Sheet ID in the Document field

#### Step 4: Activate the Workflow
1. Toggle the workflow to **Active** (top right)
2. Copy the webhook URL shown in the **"Webhook — CSV Upload"** node
   - It will be: `https://dinorscia56.app.n8n.cloud/webhook/propstream-leads`

---

### Testing with Single Record

#### Option A: Test in n8n UI
1. Open the **"Webhook — CSV Upload"** node
2. Click **"Listen for test event"**
3. In a new terminal, run:

```bash
curl -X POST "https://dinorscia56.app.n8n.cloud/webhook-test/propstream-leads?market=heber_str" \
  -H "Content-Type: text/plain" \
  --data-binary @test-data/GGC-Heber-STR-Test-Single.csv
```

#### Option B: Test against production webhook
```bash
curl -X POST "https://dinorscia56.app.n8n.cloud/webhook/propstream-leads?market=heber_str" \
  -H "Content-Type: text/plain" \
  --data-binary @test-data/GGC-Heber-STR-Test-Single.csv
```

#### Expected Response:
```json
{
  "status": "success",
  "message": "PropStream leads processed successfully",
  "market": "Heber City STR",
  "total_leads": 1,
  "hot": 0,
  "warm": 1,
  "cold": 0,
  "csv_file": "GGC-heber_str-outreach-2026-03-24.csv",
  "crm_updated": true,
  "email_sent": true
}
```

---

### Full Production Run (87 Heber leads)

```bash
curl -X POST "https://dinorscia56.app.n8n.cloud/webhook/propstream-leads?market=heber_str" \
  -H "Content-Type: text/plain" \
  --data-binary @GGC-Heber-STR-Base-March-2026.csv
```

**Note:** 87 leads × 2 Claude API calls each = ~174 API calls.
At Claude Sonnet pricing this costs roughly $0.50-1.00 total.
The workflow processes leads sequentially to stay within rate limits.

---

### Workflow Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│   Webhook    │───▶│  CSV Parser   │───▶│ Market Router │───▶│ Merge & Tag   │
│  CSV Upload  │    │ & Field Map   │    │  (Switch)     │    │ Market Config │
└─────────────┘    └──────────────┘    └──────────────┘    └───────────────┘
                                                                    │
       ┌────────────────────────────────────────────────────────────┘
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│   Claude —   │───▶│ Parse Score  │───▶│  Claude —    │───▶│ Parse Outreach│
│ Lead Scoring │    │  Response    │    │ Outreach Copy│    │   Response    │
└──────────────┘    └──────────────┘    └──────────────┘    └───────────────┘
                                                                    │
                                                         ┌──────────┴──────────┐
                                                         ▼                     ▼
                                                  ┌──────────────┐    ┌──────────────┐
                                                  │ Google Sheets│    │ Build CSV    │
                                                  │   CRM Log    │    │  Export      │
                                                  └──────────────┘    └──────┬───────┘
                                                                             │
                                                                             ▼
                                                                    ┌──────────────┐    ┌──────────────┐
                                                                    │    Gmail      │───▶│   Webhook    │
                                                                    │ Summary Email │    │  Response    │
                                                                    └──────────────┘    └──────────────┘
```

### Node Inventory (12 total)

| # | Node | Type | Status |
|---|------|------|--------|
| 1 | Webhook — CSV Upload | Trigger | ✅ Complete |
| 2 | Parse CSV & Map Fields | Code | ✅ Complete — maps all 65 PropStream columns |
| 3 | Route by Market | Switch | ✅ Complete — phoenix_mf, slc_mf, heber_str + fallback |
| 4 | Merge & Tag Market Config | Code | ✅ Complete — adds strategy/profile per market |
| 5 | Claude — Lead Scoring | HTTP Request | ⚠️ Need to select Anthropic API credential |
| 6 | Parse Score Response | Code | ✅ Complete |
| 7 | Claude — Outreach Copy | HTTP Request | ⚠️ Need to select Anthropic API credential |
| 8 | Parse Outreach Response | Code | ✅ Complete |
| 9 | Google Sheets — CRM Log | Google Sheets | ⚠️ Need credential + Sheet ID |
| 10 | Build Print-Ready CSV | Code | ✅ Complete |
| 11 | Gmail — Summary Report | Gmail | ⚠️ Need to select Gmail credential |
| 12 | Webhook Response | Respond to Webhook | ✅ Complete |

### Column Mapping Reference

| PropStream Column | → Schema Field | Transform |
|---|---|---|
| Address | property_address | Direct |
| Owner 1 First Name + Last Name | owner_name | Concatenated |
| Mailing Address | owner_mailing_address | Direct |
| Mailing City/State/Zip | owner_mailing_* | Direct |
| Owner Occupied | owner_out_of_state | Inverted (Yes→false) |
| Est. Value | assessed_value | Direct |
| Est. Equity | estimated_equity | Direct |
| Est. Loan-to-Value | estimated_equity_pct | 100 - LTV |
| Bedrooms | beds | Direct |
| Building Sqft | sqft | Direct |
| Effective Year Built | year_built | Direct |
| Last Sale Recording Date | last_sale_date | Direct |
| Total Open Loans | open_loans | Direct |
| Phone 1 | phone_primary | Direct |
| Email 1 | email_primary | Direct |
| MLS Status | mls_status | Direct |
| Foreclosure Factor | pre_foreclosure | Direct |

---

### Troubleshooting

**"Authentication failed" on Claude nodes:**
→ Open the node, click the credential dropdown, select "Anthropic API"

**"Sheet not found" on Google Sheets:**
→ Make sure the tab name matches exactly: `Phoenix_MF`, `SLC_MF`, or `Heber_STR`
→ Make sure you pasted the correct Sheet ID

**Webhook returns 404:**
→ Make sure the workflow is toggled to Active

**Claude returns empty/error scores:**
→ Check the Anthropic API credential has a valid API key with credits
→ The model used is `claude-sonnet-4-20250514` — change to `claude-3-5-sonnet-20241022` if needed
