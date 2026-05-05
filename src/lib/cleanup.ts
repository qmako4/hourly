import type { Task } from './types';
import { todayYmd, yesterdayYmd, compareYmd } from './dateUtils';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function runCleanup(tasks: Task[], now: Date = new Date()): Task[] {
  const today = todayYmd(now);
  const yesterday = yesterdayYmd(now);
  const cutoff = now.getTime() - SEVEN_DAYS_MS;

  const next: Task[] = [];
  for (const t of tasks) {
    if (t.completedAt !== null) {
      if (t.completedAt >= cutoff) next.push(t);
      continue;
    }

    if (compareYmd(t.targetDate, yesterday) < 0) {
      continue;
    }

    if (compareYmd(t.targetDate, today) < 0) {
      next.push({ ...t, targetDate: today, rolledOver: true });
      continue;
    }

    next.push(t);
  }
  return next;
}
