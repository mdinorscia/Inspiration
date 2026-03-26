import { getTodayKey, getWeekKey } from './constants';

const STORAGE_KEY = 'grain_grit_os';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStore() {
  return load();
}

// Save daily check-in scores + notes
export function saveDailyScores(scores, notes) {
  const data = load();
  const key = getTodayKey();
  if (!data.daily) data.daily = {};
  data.daily[key] = {
    scores,
    notes,
    timestamp: new Date().toISOString(),
  };
  save(data);
}

// Save track actions
export function saveTrackActions(actions) {
  const data = load();
  const key = getTodayKey();
  if (!data.daily) data.daily = {};
  if (!data.daily[key]) data.daily[key] = {};
  data.daily[key].trackActions = actions;
  save(data);
}

// Save generated priorities
export function savePriorities(priorities) {
  const data = load();
  const key = getTodayKey();
  if (!data.daily) data.daily = {};
  if (!data.daily[key]) data.daily[key] = {};
  data.daily[key].priorities = priorities;
  save(data);
}

// Toggle a priority's completed state
export function togglePriority(dayKey, index) {
  const data = load();
  if (data.daily?.[dayKey]?.priorities?.[index]) {
    data.daily[dayKey].priorities[index].done = !data.daily[dayKey].priorities[index].done;
    save(data);
  }
}

// Get today's data
export function getToday() {
  const data = load();
  return data.daily?.[getTodayKey()] || null;
}

// Get yesterday's data
export function getYesterday() {
  const data = load();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const key = d.toISOString().split('T')[0];
  return data.daily?.[key] || null;
}

// Get this week's daily entries
export function getWeekEntries() {
  const data = load();
  if (!data.daily) return [];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  const entries = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (data.daily[key]) {
      entries.push({ date: key, ...data.daily[key] });
    }
  }
  return entries;
}

// Save weekly review
export function saveWeeklyReview(review) {
  const data = load();
  const key = getWeekKey();
  if (!data.weekly) data.weekly = {};
  data.weekly[key] = {
    ...review,
    timestamp: new Date().toISOString(),
  };
  save(data);
}

// Get weekly review
export function getWeeklyReview() {
  const data = load();
  return data.weekly?.[getWeekKey()] || null;
}

// Get carried forward items (incomplete from yesterday) with original indices
export function getCarriedForward() {
  const yesterday = getYesterday();
  if (!yesterday?.priorities) return [];
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayKey = d.toISOString().split('T')[0];
  return yesterday.priorities
    .map((p, i) => ({ ...p, _sourceIndex: i, _sourceDay: yesterdayKey }))
    .filter((p) => !p.done);
}

// Move a priority to today's daily list from any source
export function movePriorityToDaily(sourceDayKey, sourceIndex, sourceType) {
  const data = load();
  let priority;

  if (sourceType === 'weekly-manual') {
    const weekKey = getWeekKey();
    priority = data.weeklyManual?.[weekKey]?.[sourceIndex];
    if (!priority) return;
    data.weeklyManual[weekKey].splice(sourceIndex, 1);
  } else {
    priority = data.daily?.[sourceDayKey]?.priorities?.[sourceIndex];
    if (!priority) return;
    data.daily[sourceDayKey].priorities[sourceIndex].done = true;
  }

  const todayKey = getTodayKey();
  if (!data.daily) data.daily = {};
  if (!data.daily[todayKey]) data.daily[todayKey] = {};
  if (!data.daily[todayKey].priorities) data.daily[todayKey].priorities = [];

  data.daily[todayKey].priorities.push({
    text: priority.text,
    level: priority.level,
    done: false,
    delegation: priority.delegation || null,
    track: priority.track || null,
  });

  save(data);
}

// Move a priority to the weekly bucket
export function movePriorityToWeekly(sourceDayKey, sourceIndex) {
  const data = load();
  const priority = data.daily?.[sourceDayKey]?.priorities?.[sourceIndex];
  if (!priority) return;

  // Remove from source day
  data.daily[sourceDayKey].priorities.splice(sourceIndex, 1);

  // Add to manual weekly list
  const weekKey = getWeekKey();
  if (!data.weeklyManual) data.weeklyManual = {};
  if (!data.weeklyManual[weekKey]) data.weeklyManual[weekKey] = [];

  data.weeklyManual[weekKey].push({
    text: priority.text,
    level: priority.level,
    done: false,
    delegation: priority.delegation || null,
    track: priority.track || null,
  });

  save(data);
}

// Get manually-placed weekly priorities
export function getManualWeeklyPriorities() {
  const data = load();
  const weekKey = getWeekKey();
  return (data.weeklyManual?.[weekKey] || []).map((p, i) => ({ ...p, _manualIndex: i })).filter(p => !p.done);
}

// Get all daily keys sorted descending
export function getAllDailyKeys() {
  const data = load();
  if (!data.daily) return [];
  return Object.keys(data.daily).sort().reverse();
}

// Check if today's check-in is complete
export function hasCheckedInToday() {
  return getToday()?.priorities != null;
}
