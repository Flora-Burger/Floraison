import type { CycleData } from '../types/cycle';
import { daysBetween, todayKey } from './dates';
import {
  computeAvgCycleLength,
  getCycleRegularity,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';
import { getPeriodOverdueDays, isPeriodDueOrLate } from './periodTiming';

export type CycleCompareResult = {
  ready: boolean;
  currentDay: number;
  previousLength: number | null;
  averageLength: number;
  deltaVsPrevious: number | null;
  deltaVsAverage: number | null;
  overdueDays: number;
  periodDueOrLate: boolean;
  summary: string;
};

export type ReliabilityScore = {
  /** 0–100 */
  score: number;
  label: string;
  detail: string;
  level: 'low' | 'medium' | 'high';
};

/**
 * Compare le cycle en cours (jours écoulés depuis le dernier début)
 * au cycle précédent complété et à la moyenne.
 */
export function computeCycleCompare(
  data: CycleData,
  date: string = todayKey(),
): CycleCompareResult {
  const starts = getPeriodStarts(data);
  const ctx = getCycleContextForDate(data, date);
  const averageLength = computeAvgCycleLength(data);
  const periodDueOrLate = isPeriodDueOrLate(data, date);
  const overdueDays = getPeriodOverdueDays(data, date);

  if (!ctx || starts.length === 0) {
    return {
      ready: false,
      currentDay: 0,
      previousLength: null,
      averageLength,
      deltaVsPrevious: null,
      deltaVsAverage: null,
      overdueDays: 0,
      periodDueOrLate: false,
      summary: 'Enregistre un début de règles pour comparer tes cycles.',
    };
  }

  const currentDay = ctx.cycleDay;
  let previousLength: number | null = null;
  if (starts.length >= 2) {
    const prevStart = starts[starts.length - 2]!;
    const lastStart = starts[starts.length - 1]!;
    const gap = daysBetween(prevStart, lastStart);
    if (gap >= 15 && gap <= 60) previousLength = gap;
  }

  const deltaVsPrevious =
    previousLength !== null ? currentDay - previousLength : null;
  const deltaVsAverage = currentDay - averageLength;

  let summary: string;
  if (periodDueOrLate && overdueDays > 0) {
    summary =
      previousLength !== null
        ? `Jour ${currentDay} — ${overdueDays} j au-delà de ta moyenne prévue. Le cycle précédent faisait ${previousLength} j.`
        : `Jour ${currentDay} — règles attendues depuis ${overdueDays} jour${overdueDays > 1 ? 's' : ''}.`;
  } else if (previousLength !== null) {
    const diff = currentDay - previousLength;
    if (Math.abs(diff) <= 1) {
      summary = `Jour ${currentDay} — tu es au même rythme que ton cycle précédent (${previousLength} j).`;
    } else if (diff > 0) {
      summary = `Jour ${currentDay} — ${diff} j de plus que ton cycle précédent (${previousLength} j), qui n’est pas encore terminé.`;
    } else {
      summary = `Jour ${currentDay} — ${Math.abs(diff)} j de moins que ton cycle précédent (${previousLength} j) pour l’instant.`;
    }
  } else {
    summary = `Jour ${currentDay} sur une moyenne d’environ ${averageLength} j. Un second cycle permettra la comparaison.`;
  }

  return {
    ready: true,
    currentDay,
    previousLength,
    averageLength,
    deltaVsPrevious,
    deltaVsAverage,
    overdueDays,
    periodDueOrLate,
    summary,
  };
}

/** Score de fiabilité des insights / prédictions (0–100). */
export function computeReliabilityScore(data: CycleData): ReliabilityScore {
  const starts = getPeriodStarts(data);
  const cycleCount = starts.length;
  const regularity = getCycleRegularity(data);

  let score = 0;
  if (cycleCount >= 1) score += 20;
  if (cycleCount >= 2) score += 25;
  if (cycleCount >= 3) score += 20;
  if (cycleCount >= 5) score += 15;

  if (regularity.status === 'regular') score += 20;
  else if (regularity.status === 'slightly_variable') score += 12;
  else if (regularity.status === 'irregular') score += 5;

  score = Math.min(100, score);

  let level: ReliabilityScore['level'] = 'low';
  let label = 'Début de suivi';
  let detail = 'Encore peu de cycles — les tendances restent indicatives.';

  if (score >= 70) {
    level = 'high';
    label = 'Fiabilité élevée';
    detail = `Basée sur ${cycleCount} cycles et une régularité ${regularity.status === 'regular' ? 'stable' : 'connue'}.`;
  } else if (score >= 40) {
    level = 'medium';
    label = 'Fiabilité moyenne';
    detail = `${cycleCount} cycle${cycleCount > 1 ? 's' : ''} — continue à noter pour affiner.`;
  }

  return { score, label, detail, level };
}
