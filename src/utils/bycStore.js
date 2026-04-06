import { getTodayKey } from './constants';

const BYC_STORAGE_KEY = 'grain_grit_byc_scores';

function load() {
  try {
    const raw = localStorage.getItem(BYC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(BYC_STORAGE_KEY, JSON.stringify(data));
}

export const BYC_CATEGORIES = [
  // Location & Access
  { id: 'traffic_count', label: 'Traffic Count', section: 'LOCATION & ACCESS' },
  { id: 'visibility', label: 'Visibility', section: 'LOCATION & ACCESS' },
  { id: 'signage', label: 'Signage Opportunity', section: 'LOCATION & ACCESS' },
  { id: 'ingress_egress', label: 'Ingress / Egress', section: 'LOCATION & ACCESS' },
  { id: 'parking', label: 'Parking', section: 'LOCATION & ACCESS' },
  // Demographics
  { id: 'pop_density', label: 'Population Density', section: 'DEMOGRAPHICS' },
  { id: 'hh_income', label: 'Median HH Income', section: 'DEMOGRAPHICS' },
  { id: 'daytime_pop', label: 'Daytime Population', section: 'DEMOGRAPHICS' },
  { id: 'growth', label: 'Growth Trajectory', section: 'DEMOGRAPHICS' },
  { id: 'demo_match', label: 'Target Demo Match', section: 'DEMOGRAPHICS' },
  // Competition
  { id: 'breakfast_void', label: 'Breakfast Void', section: 'COMPETITION' },
  { id: 'no_first_watch', label: 'No First Watch Same Pad', section: 'COMPETITION' },
  // Site Quality
  { id: 'pad_position', label: 'Pad / End-Cap Position', section: 'SITE QUALITY' },
  { id: 'building_condition', label: 'Building Condition', section: 'SITE QUALITY' },
  { id: 'co_tenancy', label: 'Co-Tenancy / Anchor', section: 'SITE QUALITY' },
];

export const MAX_SCORE = BYC_CATEGORIES.length * 5;

export function saveBycScore(siteData) {
  const data = load();
  const key = getTodayKey();
  const id = `${key}_${Date.now()}`;

  if (!data.sites) data.sites = {};
  data.sites[id] = {
    ...siteData,
    id,
    submittedAt: new Date().toISOString(),
  };
  save(data);
  return id;
}

export function getBycScores() {
  const data = load();
  if (!data.sites) return [];
  return Object.values(data.sites).sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
}

export function getBycScore(id) {
  const data = load();
  return data.sites?.[id] || null;
}
