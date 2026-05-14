const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayStart(now: number = Date.now()): number {
  return startOfDay(now);
}

export function tomorrowStart(now: number = Date.now()): number {
  return startOfDay(now) + DAY_MS;
}

export function daysBetween(a: number, b: number): number {
  return Math.floor((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

/**
 * Resolve the absolute day-start a task was originally targeting,
 * derived from createdAt + the relative label at creation time.
 */
export function resolveOriginalTargetStart(
  createdAt: number,
  targetDate: 'today' | 'tomorrow',
): number {
  const created = startOfDay(createdAt);
  return targetDate === 'today' ? created : created + DAY_MS;
}

export function isInQuietHours(now: number = Date.now()): boolean {
  const h = new Date(now).getHours();
  // Quiet 9pm (21) - 8am (8): hours >= 21 OR hours < 8
  return h >= 21 || h < 8;
}

export function msUntilNextHour(now: number = Date.now()): number {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.getTime() - now;
}

export const SEVEN_DAYS_MS = 7 * DAY_MS;
