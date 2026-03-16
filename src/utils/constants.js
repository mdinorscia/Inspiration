export const CATEGORIES = [
  { id: 'faith', label: 'Faith', track: 'personal' },
  { id: 'family', label: 'Family', track: 'personal' },
  { id: 'marriage', label: 'Marriage', track: 'personal' },
  { id: 'health', label: 'Health', track: 'personal' },
  { id: 'leadership', label: 'Leadership', track: 'personal' },
  { id: 'real_estate', label: 'Real Estate', track: 'real_estate' },
  { id: 'ai_dev', label: 'AI/Dev', track: 'ai' },
  { id: 'networking', label: 'Networking', track: 'personal' },
  { id: 'baseball', label: 'Baseball', track: 'baseball' },
];

export const TRACKS = [
  {
    id: 'personal',
    label: 'Personal OS',
    description: 'Faith, family, health, leadership, networking',
    question: "What's your one action this week for your Personal OS?",
  },
  {
    id: 'real_estate',
    label: 'Real Estate Acquisition',
    description: 'Multifamily AZ/UT + Heber STR',
    question: "What's your one action this week for Real Estate?",
  },
  {
    id: 'ai',
    label: 'AI / Automation Mastery',
    description: 'n8n operator-builder',
    question: "What's your one action this week for AI/Automation?",
  },
  {
    id: 'baseball',
    label: 'Riptide Baseball',
    description: '9U coaching + 14U select team build',
    question: "What's your one action this week for Riptide Baseball?",
  },
];

export const TEAM = [
  { name: 'McKenna', role: 'Ops' },
  { name: 'Kassie', role: 'Marketing' },
  { name: 'Jon', role: 'Legal' },
  { name: 'Yenz', role: 'Admin' },
  { name: 'Danielle', role: 'Baseball Admin' },
  { name: 'Assistant Coach', role: 'Baseball Execution' },
];

export function getScoreColor(score) {
  if (score < 6) return '#ef4444';
  if (score <= 7) return '#f59e0b';
  return '#22c55e';
}

export function getScoreLabel(score) {
  if (score < 6) return 'red';
  if (score <= 7) return 'amber';
  return 'green';
}

export function getPriorityColor(level) {
  if (level === 'P1') return '#ef4444';
  if (level === 'P2') return '#f59e0b';
  return '#22c55e';
}

export function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.ceil(diff / oneWeek);
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getWeekKey() {
  const d = new Date();
  const year = d.getFullYear();
  const week = getWeekNumber();
  return `${year}-W${week}`;
}

export function isFriday() {
  return new Date().getDay() === 5;
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
