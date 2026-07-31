import type { CycleData, DayEntry } from '../types/cycle';
import { todayKey } from './dates';

function entryToCsvRow(date: string, e: DayEntry): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const cells = [
    date,
    e.period ? '1' : '0',
    e.flow ?? '',
    (e.physical ?? []).join('|'),
    (e.mood ?? []).join('|'),
    (e.sleep ?? []).join('|'),
    (e.skin ?? []).join('|'),
    (e.discharge ?? []).join('|'),
    (e.cravings ?? []).join('|'),
    (e.sexual ?? []).join('|'),
    (e.journal ?? '').replace(/\n/g, ' '),
  ];
  return cells.map((c) => esc(String(c))).join(',');
}

export function buildPersonalExportJson(data: CycleData): string {
  return JSON.stringify(
    {
      app: 'Floraison',
      exportedAt: new Date().toISOString(),
      localDay: todayKey(),
      note: 'Export privé — à usage personnel uniquement.',
      days: data,
    },
    null,
    2,
  );
}

export function buildPersonalExportCsv(data: CycleData): string {
  const header =
    'date,period,flow,physical,mood,sleep,skin,discharge,cravings,sexual,journal';
  const dates = Object.keys(data).sort();
  const rows = dates.map((d) => entryToCsvRow(d, data[d]!));
  return [header, ...rows].join('\n');
}
