export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function daysBetween(start: string, end: string): number {
  const ms = parseDateKey(end).getTime() - parseDateKey(start).getTime();
  return Math.round(ms / 86400000);
}
