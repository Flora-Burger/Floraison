import type {
  CycleData,
  CyclePhaseId,
  DayEntry,
  SymptomKey,
} from '../types/cycle';
import { getSymptomLabel } from '../constants/symptoms';
import { getPhaseLabelPlural } from '../constants/cycleContent';
import { addDays } from './dates';
import {
  computeAvgCycleLength,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';

export const MIN_CYCLES = 3;
export const MIN_DISPLAY_RATE = 0.5;
export const MIN_LOGGED_DAYS_IN_PHASE = 2;

export type PhaseRates = Record<CyclePhaseId, number>;

export type SymptomCorrelationMap = Partial<Record<SymptomKey, PhaseRates>>;

export type SymptomInsight = {
  symptomKey: SymptomKey;
  label: string;
  phase: CyclePhaseId;
  phaseLabel: string;
  rate: number;
  sentence: string;
};

export type CorrelationResult = {
  ready: boolean;
  cycleCount: number;
  minCyclesRequired: typeof MIN_CYCLES;
  rates: SymptomCorrelationMap;
  insights: SymptomInsight[];
};

const PHASE_IDS: CyclePhaseId[] = ['menstruelle', 'folliculaire', 'ovulatoire', 'luteale'];

function emptyPhaseRecord<T>(value: T): Record<CyclePhaseId, T> {
  return {
    menstruelle: value,
    folliculaire: value,
    ovulatoire: value,
    luteale: value,
  };
}

export function isEmptyDayEntry(e: DayEntry): boolean {
  return !(
    e.period ||
    e.flow ||
    e.skin ||
    e.discharge ||
    e.journal?.trim() ||
    (e.physical && e.physical.length > 0) ||
    (e.mood && e.mood.length > 0) ||
    e.sleep ||
    (e.cravings && e.cravings.length > 0) ||
    (e.sexual && e.sexual.length > 0)
  );
}

export function extractSymptomKeys(entry: DayEntry): SymptomKey[] {
  const keys: SymptomKey[] = [];
  for (const id of entry.physical ?? []) keys.push(`physical:${id}`);
  for (const id of entry.mood ?? []) keys.push(`mood:${id}`);
  if (entry.sleep) keys.push(`sleep:${entry.sleep}`);
  for (const id of entry.cravings ?? []) keys.push(`craving:${id}`);
  for (const id of entry.sexual ?? []) keys.push(`sexual:${id}`);
  if (entry.skin) keys.push(`skin:${entry.skin}`);
  if (entry.discharge) keys.push(`discharge:${entry.discharge}`);
  return keys;
}

function formatRatePercent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

export function formatInsightSentence(
  label: string,
  phaseLabel: string,
  rate: number,
): string {
  const article = label.match(/^[aeiouhéèêàâùûîï]/i) ? "d'" : 'de ';
  return `Tu ressens ${article}${label.toLowerCase()} dans ${formatRatePercent(rate)} de tes ${phaseLabel}`;
}

export function computeSymptomCorrelations(data: CycleData): CorrelationResult {
  const starts = getPeriodStarts(data);
  const cycleCount = starts.length;
  const ready = cycleCount >= MIN_CYCLES;

  const denom = emptyPhaseRecord(0);
  const num: Partial<Record<SymptomKey, Record<CyclePhaseId, number>>> = {};
  const loggedInPhase = emptyPhaseRecord(0);

  const cycleLength = computeAvgCycleLength(data);

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const nextStart = i + 1 < starts.length ? starts[i + 1] : addDays(start, cycleLength);

    let d = start;
    while (d < nextStart) {
      const ctx = getCycleContextForDate(data, d);
      if (ctx) {
        denom[ctx.phase]++;
        const entry = data[d];
        if (entry && !isEmptyDayEntry(entry)) {
          loggedInPhase[ctx.phase]++;
          const symptoms = extractSymptomKeys(entry);
          for (const s of symptoms) {
            if (!num[s]) num[s] = emptyPhaseRecord(0);
            num[s]![ctx.phase]++;
          }
        }
      }
      d = addDays(d, 1);
    }
  }

  const rates: SymptomCorrelationMap = {};
  const insights: SymptomInsight[] = [];

  for (const [symptomKey, phaseCounts] of Object.entries(num) as [SymptomKey, Record<CyclePhaseId, number>][]) {
    const phaseRates = emptyPhaseRecord(0);
    for (const phaseId of PHASE_IDS) {
      if (denom[phaseId] === 0) continue;
      if (loggedInPhase[phaseId] < MIN_LOGGED_DAYS_IN_PHASE) continue;
      phaseRates[phaseId] = phaseCounts[phaseId] / denom[phaseId];
    }
    rates[symptomKey] = phaseRates;

    for (const phaseId of PHASE_IDS) {
      const rate = phaseRates[phaseId];
      if (rate >= MIN_DISPLAY_RATE) {
        const label = getSymptomLabel(symptomKey);
        const phaseLabel = getPhaseLabelPlural(phaseId);
        insights.push({
          symptomKey,
          label,
          phase: phaseId,
          phaseLabel,
          rate,
          sentence: formatInsightSentence(label, phaseLabel, rate),
        });
      }
    }
  }

  insights.sort((a, b) => b.rate - a.rate);

  return {
    ready,
    cycleCount,
    minCyclesRequired: MIN_CYCLES,
    rates,
    insights,
  };
}
