import { CATEGORIES, TRACKS, TEAM } from './constants';
import { getCarriedForward } from './store';

// Delegation suggestions based on task keywords
const DELEGATION_RULES = [
  { keywords: ['menu', 'food cost', 'inventory', 'operations', 'schedule', 'staffing', 'restaurant'], delegate: 'McKenna', role: 'Ops' },
  { keywords: ['social media', 'marketing', 'brand', 'content', 'campaign', 'pr', 'press'], delegate: 'Kassie', role: 'Marketing' },
  { keywords: ['lease', 'contract', 'legal', 'llc', 'entity', 'insurance', 'compliance'], delegate: 'Jon', role: 'Legal' },
  { keywords: ['invoice', 'receipt', 'admin', 'filing', 'bookkeeping', 'payroll'], delegate: 'Yenz', role: 'Admin' },
  { keywords: ['roster', 'registration', 'tournament', 'baseball admin', 'team fee'], delegate: 'Danielle', role: 'Baseball Admin' },
  { keywords: ['practice plan', 'drill', 'lineup', 'pitching rotation', 'coaching'], delegate: 'Assistant Coach', role: 'Baseball Execution' },
];

function checkDelegation(text) {
  const lower = text.toLowerCase();
  for (const rule of DELEGATION_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return { name: rule.delegate, role: rule.role };
    }
  }
  return null;
}

// Generate prioritized items from scores and track actions
export function generatePriorities(scores, notes, trackActions) {
  const items = [];

  // 1. Find lowest-scoring categories — these need attention
  const scoredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    score: scores[cat.id] || 5,
    note: notes[cat.id] || '',
  })).sort((a, b) => a.score - b.score);

  // Generate attention items for low scores
  const lowScores = scoredCategories.filter((c) => c.score < 6);
  for (const cat of lowScores.slice(0, 2)) {
    const text = cat.note
      ? `Address ${cat.label}: ${cat.note}`
      : `${cat.label} scored ${cat.score}/10 — needs focused attention today`;
    items.push({
      text,
      level: 'P1',
      track: cat.track,
      done: false,
      delegation: checkDelegation(text),
    });
  }

  // 2. Add track actions as priorities
  for (const track of TRACKS) {
    const action = trackActions[track.id];
    if (action && action.trim()) {
      // Determine priority level based on related category scores
      const relatedCats = scoredCategories.filter((c) => c.track === track.id);
      const avgScore = relatedCats.length > 0
        ? relatedCats.reduce((sum, c) => sum + c.score, 0) / relatedCats.length
        : 7;

      let level = 'P3';
      if (avgScore < 6) level = 'P1';
      else if (avgScore < 8) level = 'P2';

      items.push({
        text: action.trim(),
        level,
        track: track.id,
        done: false,
        delegation: checkDelegation(action),
      });
    }
  }

  // 3. Add amber-zone items if we have room
  const amberScores = scoredCategories.filter((c) => c.score >= 6 && c.score <= 7 && c.note);
  for (const cat of amberScores.slice(0, 1)) {
    if (items.length < 5) {
      const text = `Maintain ${cat.label}: ${cat.note}`;
      items.push({
        text,
        level: 'P2',
        track: cat.track,
        done: false,
        delegation: checkDelegation(text),
      });
    }
  }

  // Sort by priority level
  const order = { P1: 0, P2: 1, P3: 2 };
  items.sort((a, b) => order[a.level] - order[b.level]);

  // Cap at 5 items
  return items.slice(0, 5);
}

// Generate weekly summary from the week's data
export function generateWeeklySummary(weekEntries, wins, adjustment) {
  const allScores = {};
  for (const cat of CATEGORIES) {
    allScores[cat.id] = [];
  }

  for (const entry of weekEntries) {
    if (entry.scores) {
      for (const cat of CATEGORIES) {
        if (entry.scores[cat.id] != null) {
          allScores[cat.id].push(entry.scores[cat.id]);
        }
      }
    }
  }

  const averages = {};
  const trends = {};
  for (const cat of CATEGORIES) {
    const vals = allScores[cat.id];
    if (vals.length > 0) {
      averages[cat.id] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      if (vals.length >= 2) {
        const first = vals.slice(0, Math.ceil(vals.length / 2));
        const second = vals.slice(Math.ceil(vals.length / 2));
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
        const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
        trends[cat.id] = avgSecond > avgFirst ? 'up' : avgSecond < avgFirst ? 'down' : 'flat';
      } else {
        trends[cat.id] = 'flat';
      }
    }
  }

  // Count completed priorities
  let totalPriorities = 0;
  let completedPriorities = 0;
  for (const entry of weekEntries) {
    if (entry.priorities) {
      totalPriorities += entry.priorities.length;
      completedPriorities += entry.priorities.filter((p) => p.done).length;
    }
  }

  return {
    averages,
    trends,
    totalPriorities,
    completedPriorities,
    completionRate: totalPriorities > 0 ? Math.round((completedPriorities / totalPriorities) * 100) : 0,
    wins: wins.filter((w) => w.trim()),
    adjustment,
    checkInDays: weekEntries.length,
  };
}
