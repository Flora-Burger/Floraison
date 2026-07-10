import type {
  CycleData,
  CyclePhaseId,
  DayEntry,
  InsightPhaseId,
  SymptomKey,
} from '../types/cycle';
import { getSymptomLabel } from '../constants/symptoms';
import { getPhaseById } from '../constants/cycleContent';
import { TRACK_COLORS } from '../constants/theme';
import { addDays, todayKey } from './dates';
import {
  computeAvgCycleLength,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate, getDaysUntilNextPeriod } from './cyclePhase';

export const MIN_CYCLES = 2;
export const MIN_DISPLAY_RATE = 0.5;
export const MIN_LOGGED_DAYS_IN_PHASE = 2;
export const PRE_MENSTRUAL_DAYS = 7;

export type TrackCategoryId =
  | 'discharge'
  | 'physical'
  | 'skin'
  | 'mood'
  | 'sleep'
  | 'cravings'
  | 'sexual';

export type InsightKind = 'symptom' | 'category';
export type InsightConfidence = 'tentative' | 'confirmed';

export const TRACK_CATEGORIES: TrackCategoryId[] = [
  'discharge',
  'physical',
  'skin',
  'mood',
  'sleep',
  'cravings',
  'sexual',
];

export const CATEGORY_LABELS: Record<TrackCategoryId, string> = {
  discharge: 'Pertes',
  physical: 'Symptômes physiques',
  skin: 'Peau',
  mood: 'Humeur & émotions',
  sleep: 'Sommeil',
  cravings: 'Envies alimentaires',
  sexual: 'Libido & vie sexuelle',
};

export type PhaseRates = Record<CyclePhaseId, number>;

export type SymptomCorrelationMap = Partial<Record<SymptomKey, PhaseRates>>;

export type SymptomInsight = {
  id: string;
  kind: InsightKind;
  symptomKey?: SymptomKey;
  categoryId?: TrackCategoryId;
  label: string;
  phase: InsightPhaseId;
  phaseLabel: string;
  rate: number;
  sentence: string;
  confidence: InsightConfidence;
  evidenceDays: number;
};

export type CorrelationResult = {
  /** Au moins MIN_CYCLES débuts de règles enregistrés. */
  ready: boolean;
  cycleCount: number;
  minCyclesRequired: typeof MIN_CYCLES;
  rates: SymptomCorrelationMap;
  insights: SymptomInsight[];
  categoryInsights: SymptomInsight[];
  symptomInsights: SymptomInsight[];
  heroInsight: SymptomInsight | null;
  timeline: TimelineSegment[];
  /** Position du jour actuel sur la timeline (0–1). */
  timelinePosition: number;
  upcoming: UpcomingAlert[];
};

export type TimelineSegment = {
  phaseId: CyclePhaseId;
  shortLabel: string;
  color: string;
  flex: number;
  patternColors: string[];
};

export type UpcomingAlert = {
  id: string;
  label: string;
  targetDate: string;
  daysUntil: number;
  rate: number;
  confidence: InsightConfidence;
  phase: InsightPhaseId;
};

const PHASE_IDS: CyclePhaseId[] = ['menstruelle', 'folliculaire', 'ovulatoire', 'luteale'];

const PHASE_CONTEXT: Record<CyclePhaseId, string> = {
  menstruelle: 'pendant tes phases menstruelles',
  folliculaire: 'pendant tes phases folliculaires',
  ovulatoire: 'pendant tes phases ovulatoires',
  luteale: 'pendant tes phases lutéales',
};

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
    (e.skin && e.skin.length > 0) ||
    (e.discharge && e.discharge.length > 0) ||
    e.journal?.trim() ||
    (e.physical && e.physical.length > 0) ||
    (e.mood && e.mood.length > 0) ||
    (e.sleep && e.sleep.length > 0) ||
    (e.cravings && e.cravings.length > 0) ||
    (e.sexual && e.sexual.length > 0)
  );
}

export function entryHasCategory(entry: DayEntry, category: TrackCategoryId): boolean {
  switch (category) {
    case 'discharge':
      return (entry.discharge?.length ?? 0) > 0;
    case 'physical':
      return (entry.physical?.length ?? 0) > 0;
    case 'skin':
      return (entry.skin?.length ?? 0) > 0;
    case 'mood':
      return (entry.mood?.length ?? 0) > 0;
    case 'sleep':
      return (entry.sleep?.length ?? 0) > 0;
    case 'cravings':
      return (entry.cravings?.length ?? 0) > 0;
    case 'sexual':
      return (entry.sexual?.length ?? 0) > 0;
  }
}

export function extractSymptomKeys(entry: DayEntry): SymptomKey[] {
  const keys: SymptomKey[] = [];
  for (const id of entry.physical ?? []) keys.push(`physical:${id}`);
  for (const id of entry.mood ?? []) keys.push(`mood:${id}`);
  for (const id of entry.sleep ?? []) keys.push(`sleep:${id}`);
  for (const id of entry.cravings ?? []) keys.push(`craving:${id}`);
  for (const id of entry.sexual ?? []) keys.push(`sexual:${id}`);
  for (const id of entry.skin ?? []) keys.push(`skin:${id}`);
  for (const id of entry.discharge ?? []) keys.push(`discharge:${id}`);
  return keys;
}

function formatRatePercent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

function getPhaseContext(phaseId: InsightPhaseId): string {
  if (phaseId === 'avant_regles') {
    return 'dans les 7 jours avant tes règles';
  }
  return PHASE_CONTEXT[phaseId];
}

export function formatInsightSentence(
  label: string,
  phaseId: InsightPhaseId,
  rate: number,
): string {
  const article = label.match(/^[aeiouhéèêàâùûîï]/i) ? "d'" : 'de ';
  return `Tu ressens ${article}${label.toLowerCase()} dans ${formatRatePercent(rate)} de tes jours notés ${getPhaseContext(phaseId)}`;
}

export function formatCategoryInsightSentence(
  categoryLabel: string,
  phaseId: InsightPhaseId,
  rate: number,
): string {
  return `Tu notes surtout ${categoryLabel.toLowerCase()} dans ${formatRatePercent(rate)} de tes jours renseignés ${getPhaseContext(phaseId)}`;
}

function getInsightPhaseLabel(phaseId: InsightPhaseId): string {
  if (phaseId === 'avant_regles') {
    return `7 jours avant tes règles`;
  }
  return PHASE_CONTEXT[phaseId].replace('pendant tes ', '').replace('tes ', '');
}

function makeInsightId(
  kind: InsightKind,
  phase: InsightPhaseId,
  key: SymptomKey | TrackCategoryId,
): string {
  return `${kind}:${key}:${phase}`;
}

/** Fusionne lutéale vs avant-règles : garde la fenêtre la plus précise ou le taux le plus élevé. */
export function dedupeLutealVsPremenstrual(insights: SymptomInsight[]): SymptomInsight[] {
  const groups = new Map<string, SymptomInsight[]>();

  for (const insight of insights) {
    const groupKey =
      insight.kind === 'symptom' && insight.symptomKey
        ? `symptom:${insight.symptomKey}`
        : insight.kind === 'category' && insight.categoryId
          ? `category:${insight.categoryId}`
          : insight.id;
    const list = groups.get(groupKey) ?? [];
    list.push(insight);
    groups.set(groupKey, list);
  }

  const result: SymptomInsight[] = [];
  for (const list of groups.values()) {
    const luteal = list.find((i) => i.phase === 'luteale');
    const premenstrual = list.find((i) => i.phase === 'avant_regles');
    if (luteal && premenstrual) {
      result.push(premenstrual.rate >= luteal.rate ? premenstrual : luteal);
      result.push(...list.filter((i) => i.phase !== 'luteale' && i.phase !== 'avant_regles'));
    } else {
      result.push(...list);
    }
  }

  return result;
}

/** Phase d'insight pour une date (avant-règles prioritaire sur lutéale). */
export function getInsightPhaseForDate(
  data: CycleData,
  date: string,
): InsightPhaseId | null {
  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return null;
  const daysUntil = getDaysUntilNextPeriod(data, date);
  if (daysUntil !== null && daysUntil >= 1 && daysUntil <= PRE_MENSTRUAL_DAYS) {
    return 'avant_regles';
  }
  return ctx.phase;
}

function insightAccentColor(insight: SymptomInsight): string {
  return TRACK_COLORS.physical;
}

function pickHeroInsight(symptomInsights: SymptomInsight[]): SymptomInsight | null {
  return symptomInsights[0] ?? null;
}

function buildTimeline(
  data: CycleData,
  insights: SymptomInsight[],
): { segments: TimelineSegment[]; position: number } {
  const ctx = getCycleContextForDate(data, todayKey());
  if (!ctx) return { segments: [], position: 0 };

  const segments: TimelineSegment[] = PHASE_IDS.map((phaseId) => {
    const matching = insights.filter(
      (i) =>
        i.phase === phaseId ||
        (phaseId === 'luteale' && i.phase === 'avant_regles'),
    );
    const patternColors = [
      ...new Set(matching.map((i) => insightAccentColor(i))),
    ].slice(0, 4);

    return {
      phaseId,
      shortLabel: getPhaseById(phaseId).emoji,
      color: getPhaseById(phaseId).color,
      flex: Math.max(ctx.segmentDays[phaseId], 1),
      patternColors,
    };
  });

  const position = Math.min(
    Math.max((ctx.cycleDay - 0.5) / ctx.cycleLength, 0.02),
    0.98,
  );

  return { segments, position };
}

function computeUpcomingAlerts(
  data: CycleData,
  insights: SymptomInsight[],
): UpcomingAlert[] {
  const today = todayKey();
  const alerts: UpcomingAlert[] = [];
  const usedIds = new Set<string>();

  const candidates = insights
    .filter((i) => i.kind === 'symptom')
    .sort((a, b) => b.rate - a.rate);

  for (const insight of candidates) {
    if (usedIds.has(insight.id)) continue;

    for (let offset = 1; offset <= 14; offset++) {
      const date = addDays(today, offset);
      const phase = getInsightPhaseForDate(data, date);
      if (phase !== insight.phase) continue;

      const prevPhase =
        offset === 1
          ? getInsightPhaseForDate(data, today)
          : getInsightPhaseForDate(data, addDays(today, offset - 1));
      if (prevPhase === insight.phase) continue;

      alerts.push({
        id: `upcoming:${insight.id}`,
        label: insight.label,
        targetDate: date,
        daysUntil: offset,
        rate: insight.rate,
        confidence: insight.confidence,
        phase: insight.phase,
      });
      usedIds.add(insight.id);
      break;
    }

    if (alerts.length >= 3) break;
  }

  return alerts;
}

export function computeSymptomCorrelations(data: CycleData): CorrelationResult {
  const starts = getPeriodStarts(data);
  const cycleCount = starts.length;
  const ready = cycleCount >= MIN_CYCLES;
  const confidence: InsightConfidence = ready ? 'confirmed' : 'tentative';

  const loggedInPhase = emptyPhaseRecord(0);
  const num: Partial<Record<SymptomKey, Record<CyclePhaseId, number>>> = {};

  const preMenstrualNum: Partial<Record<SymptomKey, number>> = {};
  let preMenstrualLoggedCount = 0;

  const cycleLength = computeAvgCycleLength(data);

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const nextStart = i + 1 < starts.length ? starts[i + 1] : addDays(start, cycleLength);

    let d = start;
    while (d < nextStart) {
      const ctx = getCycleContextForDate(data, d);
      if (ctx) {
        const entry = data[d];
        const hasLoggedDay = entry && !isEmptyDayEntry(entry);

        if (hasLoggedDay) {
          loggedInPhase[ctx.phase]++;
          const symptoms = extractSymptomKeys(entry);
          for (const s of symptoms) {
            if (!num[s]) num[s] = emptyPhaseRecord(0);
            num[s]![ctx.phase]++;
          }
        }

        const daysUntil = getDaysUntilNextPeriod(data, d);
        if (
          daysUntil !== null &&
          daysUntil >= 1 &&
          daysUntil <= PRE_MENSTRUAL_DAYS &&
          hasLoggedDay
        ) {
          preMenstrualLoggedCount++;
          const symptoms = extractSymptomKeys(entry);
          for (const s of symptoms) {
            preMenstrualNum[s] = (preMenstrualNum[s] ?? 0) + 1;
          }
        }
      }
      d = addDays(d, 1);
    }
  }

  const rates: SymptomCorrelationMap = {};
  const symptomInsights: SymptomInsight[] = [];

  for (const [symptomKey, phaseCounts] of Object.entries(num) as [SymptomKey, Record<CyclePhaseId, number>][]) {
    const phaseRates = emptyPhaseRecord(0);
    for (const phaseId of PHASE_IDS) {
      if (loggedInPhase[phaseId] < MIN_LOGGED_DAYS_IN_PHASE) continue;
      phaseRates[phaseId] = phaseCounts[phaseId] / loggedInPhase[phaseId];
    }
    rates[symptomKey] = phaseRates;

    for (const phaseId of PHASE_IDS) {
      const rate = phaseRates[phaseId];
      if (rate >= MIN_DISPLAY_RATE) {
        const label = getSymptomLabel(symptomKey);
        symptomInsights.push({
          id: makeInsightId('symptom', phaseId, symptomKey),
          kind: 'symptom',
          symptomKey,
          label,
          phase: phaseId,
          phaseLabel: getInsightPhaseLabel(phaseId),
          rate,
          sentence: formatInsightSentence(label, phaseId, rate),
          confidence,
          evidenceDays: phaseCounts[phaseId],
        });
      }
    }
  }

  if (preMenstrualLoggedCount >= MIN_LOGGED_DAYS_IN_PHASE) {
    for (const [symptomKey, count] of Object.entries(preMenstrualNum) as [SymptomKey, number][]) {
      const rate = count / preMenstrualLoggedCount;
      if (rate >= MIN_DISPLAY_RATE) {
        const label = getSymptomLabel(symptomKey);
        symptomInsights.push({
          id: makeInsightId('symptom', 'avant_regles', symptomKey),
          kind: 'symptom',
          symptomKey,
          label,
          phase: 'avant_regles',
          phaseLabel: getInsightPhaseLabel('avant_regles'),
          rate,
          sentence: formatInsightSentence(label, 'avant_regles', rate),
          confidence,
          evidenceDays: count,
        });
      }
    }
  }

  const dedupedSymptoms = dedupeLutealVsPremenstrual(symptomInsights).sort(
    (a, b) => b.rate - a.rate,
  );

  const heroInsight = pickHeroInsight(dedupedSymptoms);
  const allInsights = dedupedSymptoms;
  const { segments: timeline, position: timelinePosition } = buildTimeline(data, allInsights);
  const upcoming = computeUpcomingAlerts(data, allInsights);

  return {
    ready,
    cycleCount,
    minCyclesRequired: MIN_CYCLES,
    rates,
    insights: allInsights,
    categoryInsights: [],
    symptomInsights: dedupedSymptoms,
    heroInsight,
    timeline,
    timelinePosition,
    upcoming,
  };
}
