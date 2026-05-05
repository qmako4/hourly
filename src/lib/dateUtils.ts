export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayYmd(now: Date = new Date()): string {
  return ymd(now);
}

export function tomorrowYmd(now: Date = new Date()): string {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return ymd(t);
}

export function yesterdayYmd(now: Date = new Date()): string {
  const t = new Date(now);
  t.setDate(t.getDate() - 1);
  return ymd(t);
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(`${fromYmd}T00:00:00`);
  const to = new Date(`${toYmd}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function compareYmd(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
