import type { CycleData, CyclePhaseId } from '../types/cycle';
import { addDays, daysBetween } from './dates';
import {
  computeAvgCycleLength,
  computeAvgPeriodDays,
  computeOvulationDate,
  findPeriodStartForDate,
  getPeriodStarts,
} from './cycleMath';

export type PhaseBounds = Record<CyclePhaseId, { startDay: number; endDay: number }>;

export type CycleContext = {
  date: string;
  periodStart: string;
  cycleDay: number;
  cycleLength: number;
  periodDays: number;
  ovulationDate: string;
  ovulationDay: number;
  phase: CyclePhaseId;
  bounds: PhaseBounds;
  segmentDays: Record<CyclePhaseId, number>;
};

export function computePhaseBounds(
  periodDays: number,
  ovulationDay: number,
  cycleLength: number,
): PhaseBounds {
  const follicularEnd = Math.max(periodDays, ovulationDay - 1);
  const follicularStart = periodDays + 1;

  return {
    menstruelle: { startDay: 1, endDay: periodDays },
    folliculaire: {
      startDay: follicularStart,
      endDay: follicularEnd >= follicularStart ? follicularEnd : follicularStart - 1,
    },
    ovulatoire: { startDay: ovulationDay, endDay: ovulationDay },
    luteale: {
      startDay: ovulationDay + 1,
      endDay: cycleLength,
    },
  };
}

export function segmentDaysFromBounds(bounds: PhaseBounds): Record<CyclePhaseId, number> {
  const days = (b: { startDay: number; endDay: number }) =>
    b.endDay >= b.startDay ? b.endDay - b.startDay + 1 : 0;

  return {
    menstruelle: days(bounds.menstruelle),
    folliculaire: days(bounds.folliculaire),
    ovulatoire: days(bounds.ovulatoire),
    luteale: days(bounds.luteale),
  };
}

export function getPhaseForCycleDay(
  cycleDay: number,
  periodDays: number,
  ovulationDay: number,
  cycleLength: number,
): CyclePhaseId {
  if (cycleDay <= periodDays) return 'menstruelle';
  if (cycleDay === ovulationDay) return 'ovulatoire';
  if (cycleDay > ovulationDay) {
    if (cycleDay > cycleLength) return 'luteale';
    return 'luteale';
  }
  if (cycleDay < ovulationDay) return 'folliculaire';
  return 'luteale';
}

export function getCycleContextForDate(data: CycleData, date: string): CycleContext | null {
  if (getPeriodStarts(data).length === 0) return null;

  const periodStart = findPeriodStartForDate(data, date);
  if (!periodStart) return null;

  const cycleLength = computeAvgCycleLength(data);
  const periodDays = computeAvgPeriodDays(data);
  const cycleDay = daysBetween(periodStart, date) + 1;

  const ovulationDate = computeOvulationDate(periodStart, cycleLength);
  const ovulationDay = daysBetween(periodStart, ovulationDate) + 1;

  const bounds = computePhaseBounds(periodDays, ovulationDay, cycleLength);
  const segmentDays = segmentDaysFromBounds(bounds);

  const phase =
    cycleDay > cycleLength
      ? 'luteale'
      : getPhaseForCycleDay(cycleDay, periodDays, ovulationDay, cycleLength);

  return {
    date,
    periodStart,
    cycleDay,
    cycleLength,
    periodDays,
    ovulationDate,
    ovulationDay,
    phase,
    bounds,
    segmentDays,
  };
}

export function getPhaseForDate(data: CycleData, date: string): CyclePhaseId | null {
  return getCycleContextForDate(data, date)?.phase ?? null;
}
