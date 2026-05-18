import type { TargetDate } from './types';
import { startOfDay } from './dateUtils';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Look for an explicit time reference inside a task's text — patterns like
 * "at 12pm", "by 3:30", "@ 5". Returns a millisecond timestamp anchored to
 * the task's target day, or null if the parsed time has already passed.
 *
 * Heuristics for the 12/24-hour ambiguity (used only when no am/pm marker):
 *   • hour 1–7    → PM  (e.g. "at 3" → 15:00, "at 6" → 18:00)
 *   • hour 8–11   → AM  (e.g. "at 9" → 09:00)
 *   • hour 12–23  → 24-hour  (e.g. "at 18" → 18:00)
 */
const TIME_RE =
  /\b(?:at|by|@)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i;

/** The matched "at 12pm" substring and where it sits in the text. */
export function findTimePhrase(
  text: string,
): { phrase: string; index: number } | null {
  const m = TIME_RE.exec(text);
  if (!m) return null;
  return { phrase: m[0], index: m.index };
}

/** Resolve a parsed clock time into an absolute ms timestamp, anchored to
 *  the task's target day. Returns null if it has already passed. */
export function parseDeadline(
  text: string,
  targetDate: TargetDate,
  now: number = Date.now(),
): number | null {
  const m = TIME_RE.exec(text);
  if (!m) return null;
  const rawHour = Number(m[1]);
  const rawMin = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.toLowerCase().replace(/\./g, '');
  if (Number.isNaN(rawHour) || Number.isNaN(rawMin)) return null;
  if (rawHour > 23 || rawMin > 59) return null;

  let hour: number;
  if (meridiem === 'pm') {
    hour = rawHour === 12 ? 12 : rawHour + 12;
  } else if (meridiem === 'am') {
    hour = rawHour === 12 ? 0 : rawHour;
  } else if (rawHour >= 12) {
    hour = rawHour; // already 24-hour
  } else if (rawHour <= 7) {
    hour = rawHour + 12; // assume PM for early afternoon hours
  } else {
    hour = rawHour; // 8–11 → AM
  }
  if (hour > 23) return null;

  const dayStart = startOfDay(now) + (targetDate === 'tomorrow' ? DAY_MS : 0);
  const due = dayStart + hour * 60 * 60 * 1000 + rawMin * 60 * 1000;

  // Past deadlines are dropped (per spec): the task survives but no pings.
  if (due <= now) return null;
  return due;
}

/** Compact human label for a deadline timestamp, e.g. "12pm", "6:30pm", "9am". */
export function formatTimeLabel(dueAt: number): string {
  const d = new Date(dueAt);
  const h24 = d.getHours();
  const mins = d.getMinutes();
  const meridiem = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return mins === 0
    ? `${h12}${meridiem}`
    : `${h12}:${String(mins).padStart(2, '0')}${meridiem}`;
}
