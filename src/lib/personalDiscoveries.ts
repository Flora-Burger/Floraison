import type { CycleData, CyclePhaseId, DayEntry, MoodTag, SleepQuality } from '../types/cycle';
import { MOOD_OPTIONS } from '../constants/symptoms';
import { getPhaseById } from '../constants/cycleContent';
import {
  computeSymptomCorrelations,
  isEmptyDayEntry,
  MIN_LOGGED_DAYS_IN_PHASE,
  MIN_PHASE_RATE_MARGIN,
} from './cycleInsights';
import { getArticleIdForInsight } from './insightArticles';
import { todayKey } from './dates';
import {
  computeAvgCycleLength,
  computeCycleGaps,
  getCycleRegularity,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';

export type DiscoveryKind =
  | 'symptom_phase_pattern'
  | 'cycle_length_tendency'
  | 'mood_phase_correlation'
  | 'mood_sleep_correlation'
  | 'period_start_weekday';

export type DiscoveryIcon = 'symptom' | 'cycle' | 'mood' | 'calendar' | 'sleep';

export type PersonalDiscovery = {
  id: string;
  kind: DiscoveryKind;
  title: string;
  body: string;
  icon: DiscoveryIcon;
  detectedAt: string;
  /** Id article Corps (phase ou topic) pour « En savoir plus ». */
  articleId?: string;
};

export const MIN_CYCLES_FOR_DISCOVERIES = 3;
/** Seuil plus strict que les insights généraux — évite les motifs fragiles. */
const DISCOVERY_MIN_RATE = 0.7;
const DISCOVERY_MIN_WEEKDAY_COUNT = 3;

const WEEKDAY_LABELS = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const;

const PHASE_LABELS: Record<CyclePhaseId, string> = {
  menstruelle: 'phase menstruelle',
  folliculaire: 'phase folliculaire',
  ovulatoire: 'phase ovulatoire',
  luteale: 'phase lutéale',
};

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

function detectSymptomPatterns(data: CycleData, cycleCount: number): PersonalDiscovery[] {
  const { symptomInsights } = computeSymptomCorrelations(data);
  const now = todayKey();
  return symptomInsights
    .filter((insight) => insight.rate >= DISCOVERY_MIN_RATE && insight.confidence === 'confirmed')
    .slice(0, 2)
    .map((insight) => {
    const phaseLabel =
      insight.phase === 'avant_regles'
        ? 'les 7 jours avant tes règles'
        : PHASE_LABELS[insight.phase as CyclePhaseId] ?? insight.phase;
    const symptomArticle = getArticleIdForInsight(insight);
    const phaseArticle =
      insight.phase !== 'avant_regles' ? (insight.phase as CyclePhaseId) : 'luteale';
    return {
      id: `discovery:symptom:${insight.id}`,
      kind: 'symptom_phase_pattern' as const,
      title: `${insight.label} en ${insight.phase === 'avant_regles' ? 'fin de cycle' : getPhaseById(insight.phase as CyclePhaseId).shortTitle.toLowerCase()}`,
      body: `Dans tes ${cycleCount} derniers cycles, tu as noté « ${insight.label.toLowerCase()} » sur ${formatPercent(insight.rate)} des jours renseignés ${phaseLabel === 'les 7 jours avant tes règles' ? phaseLabel : `en ${phaseLabel}`}.`,
      icon: 'symptom' as const,
      detectedAt: now,
      articleId: symptomArticle ?? phaseArticle,
    };
  });
}

function detectCycleLengthTendency(data: CycleData): PersonalDiscovery | null {
  const gaps = computeCycleGaps(data);
  if (gaps.length < MIN_CYCLES_FOR_DISCOVERIES - 1) return null;

  const regularity = getCycleRegularity(data);
  if (regularity.status === 'insufficient') return null;

  const avg = computeAvgCycleLength(data);
  const min = regularity.minGap ?? Math.min(...gaps);
  const max = regularity.maxGap ?? Math.max(...gaps);
  const count = gaps.length + 1;

  if (regularity.status === 'regular') {
    return {
      id: 'discovery:cycle:stable',
      kind: 'cycle_length_tendency',
      title: 'Cycles assez stables',
      body: `Sur tes ${count} derniers cycles, la durée va de ${min} à ${max} jours (moyenne ${avg}). L’écart reste modéré.`,
      icon: 'cycle',
      detectedAt: todayKey(),
      articleId: 'folliculaire',
    };
  }

  if (regularity.status === 'slightly_variable' || regularity.status === 'irregular') {
    const variableLabel =
      regularity.status === 'irregular' ? 'variables' : 'un peu variables';
    return {
      id: `discovery:cycle:${regularity.status}`,
      kind: 'cycle_length_tendency',
      title: `Cycles ${variableLabel}`,
      body: `Sur tes ${count} derniers cycles, la durée va de ${min} à ${max} jours (moyenne ${avg}). La variation est plus marquée qu’une moyenne « très régulière ».`,
      icon: 'cycle',
      detectedAt: todayKey(),
      articleId: 'luteale',
    };
  }

  return null;
}

function maxOtherPhaseRate(
  phaseRates: Record<CyclePhaseId, number>,
  target: CyclePhaseId,
): number {
  let max = 0;
  for (const phase of Object.keys(phaseRates) as CyclePhaseId[]) {
    if (phase === target) continue;
    max = Math.max(max, phaseRates[phase] ?? 0);
  }
  return max;
}

function detectMoodCorrelations(data: CycleData): PersonalDiscovery[] {
  const moodIds = MOOD_OPTIONS.map((m) => m.id);
  const loggedInPhase: Record<CyclePhaseId, number> = {
    menstruelle: 0,
    folliculaire: 0,
    ovulatoire: 0,
    luteale: 0,
  };
  const counts: Record<MoodTag, Record<CyclePhaseId, number>> = {} as never;

  for (const mood of moodIds) {
    counts[mood] = { menstruelle: 0, folliculaire: 0, ovulatoire: 0, luteale: 0 };
  }

  for (const date of Object.keys(data)) {
    const entry = data[date];
    if (!entry || isEmptyDayEntry(entry) || !entry.mood?.length) continue;
    const ctx = getCycleContextForDate(data, date);
    if (!ctx) continue;
    loggedInPhase[ctx.phase]++;
    for (const mood of entry.mood) {
      if (counts[mood]) counts[mood][ctx.phase]++;
    }
  }

  const discoveries: PersonalDiscovery[] = [];

  for (const mood of moodIds) {
    let bestPhase: CyclePhaseId | null = null;
    let bestRate = 0;
    for (const phase of Object.keys(loggedInPhase) as CyclePhaseId[]) {
      if (loggedInPhase[phase] < MIN_LOGGED_DAYS_IN_PHASE) continue;
      const rate = counts[mood][phase] / loggedInPhase[phase];
      const phaseRates = Object.fromEntries(
        (Object.keys(loggedInPhase) as CyclePhaseId[]).map((p) => [
          p,
          loggedInPhase[p] > 0 ? counts[mood][p] / loggedInPhase[p] : 0,
        ]),
      ) as Record<CyclePhaseId, number>;
      const other = maxOtherPhaseRate(phaseRates, phase);
      if (rate >= DISCOVERY_MIN_RATE && rate >= other + MIN_PHASE_RATE_MARGIN && rate > bestRate) {
        bestPhase = phase;
        bestRate = rate;
      }
    }

    if (!bestPhase) continue;
    const label = MOOD_OPTIONS.find((m) => m.id === mood)?.label ?? mood;
    discoveries.push({
      id: `discovery:mood:${mood}:${bestPhase}`,
      kind: 'mood_phase_correlation',
      title: `Humeur « ${label.toLowerCase()} » en ${getPhaseById(bestPhase).shortTitle.toLowerCase()}`,
      body: `Le tag « ${label.toLowerCase()} » apparaît sur ${formatPercent(bestRate)} de tes jours ${PHASE_LABELS[bestPhase]} renseignés, plus souvent qu’en moyenne sur les autres phases.`,
      icon: 'mood',
      detectedAt: todayKey(),
      articleId: bestPhase,
    });
  }

  return discoveries.slice(0, 2);
}

function detectPeriodWeekday(data: CycleData): PersonalDiscovery | null {
  const starts = getPeriodStarts(data);
  if (starts.length < MIN_CYCLES_FOR_DISCOVERIES) return null;

  const recent = starts.slice(-6);
  const weekdayCounts = new Array(7).fill(0) as number[];
  for (const start of recent) {
    const d = new Date(start + 'T12:00:00');
    weekdayCounts[d.getDay()]++;
  }

  const maxCount = Math.max(...weekdayCounts);
  if (maxCount < DISCOVERY_MIN_WEEKDAY_COUNT) return null;

  const topDays = weekdayCounts
    .map((count, day) => ({ count, day }))
    .filter((x) => x.count === maxCount);
  if (topDays.length > 1) return null;

  const weekday = topDays[0]!.day;
  const label = WEEKDAY_LABELS[weekday];

  return {
    id: `discovery:weekday:${weekday}`,
    kind: 'period_start_weekday',
    title: `Règles souvent le ${label}`,
    body: `Sur tes ${recent.length} derniers débuts de cycle enregistrés, ${maxCount} commencent un ${label}.`,
    icon: 'calendar',
    detectedAt: todayKey(),
    articleId: 'menstruelle',
  };
}

const POOR_SLEEP: SleepQuality[] = [
  'endormissement_difficile',
  'reveils_frequents',
  'insomnie',
  'besoin_plus_sommeil',
];
const LOW_MOOD: MoodTag[] = ['irritable', 'anxieuse', 'triste', 'stressee'];
const MIN_SLEEP_MOOD_DAYS = 5;

function hasPoorSleep(entry: DayEntry): boolean {
  return Boolean(entry.sleep?.some((s) => POOR_SLEEP.includes(s)));
}

function hasGoodSleepOnly(entry: DayEntry): boolean {
  if (!entry.sleep?.length) return false;
  return entry.sleep.includes('bonne_nuit') && !hasPoorSleep(entry);
}

function hasLowMood(entry: DayEntry): boolean {
  return Boolean(entry.mood?.some((m) => LOW_MOOD.includes(m)));
}

/** Humeur basse plus fréquente les jours de sommeil difficile. */
function detectMoodSleepCorrelation(data: CycleData): PersonalDiscovery | null {
  let poorDays = 0;
  let poorLow = 0;
  let goodDays = 0;
  let goodLow = 0;

  for (const date of Object.keys(data)) {
    const entry = data[date];
    if (!entry || isEmptyDayEntry(entry)) continue;
    if (!entry.sleep?.length || !entry.mood?.length) continue;

    if (hasPoorSleep(entry)) {
      poorDays++;
      if (hasLowMood(entry)) poorLow++;
    } else if (hasGoodSleepOnly(entry)) {
      goodDays++;
      if (hasLowMood(entry)) goodLow++;
    }
  }

  if (poorDays < MIN_SLEEP_MOOD_DAYS || goodDays < MIN_SLEEP_MOOD_DAYS) return null;

  const poorRate = poorLow / poorDays;
  const goodRate = goodLow / goodDays;
  if (poorRate < DISCOVERY_MIN_RATE) return null;
  if (poorRate < goodRate + MIN_PHASE_RATE_MARGIN) return null;

  return {
    id: 'discovery:mood-sleep',
    kind: 'mood_sleep_correlation',
    title: 'Humeur et sommeil liés',
    body: `Sur tes jours avec sommeil difficile, une humeur plus lourde (irritable, triste, anxieuse…) apparaît ${formatPercent(poorRate)} du temps, contre ${formatPercent(goodRate)} après une bonne nuit.`,
    icon: 'sleep',
    detectedAt: todayKey(),
    articleId: 'luteale',
  };
}

export type PersonalDiscoveriesResult = {
  ready: boolean;
  cycleCount: number;
  discoveries: PersonalDiscovery[];
};

export function computePersonalDiscoveries(data: CycleData): PersonalDiscoveriesResult {
  const starts = getPeriodStarts(data);
  const cycleCount = starts.length;

  if (cycleCount < MIN_CYCLES_FOR_DISCOVERIES) {
    return { ready: false, cycleCount, discoveries: [] };
  }

  const discoveries: PersonalDiscovery[] = [];

  const cycleDiscovery = detectCycleLengthTendency(data);
  if (cycleDiscovery) {
    discoveries.push(cycleDiscovery);
  }

  const weekdayDiscovery = detectPeriodWeekday(data);
  if (weekdayDiscovery) {
    discoveries.push(weekdayDiscovery);
  }

  const moodSleep = detectMoodSleepCorrelation(data);
  if (moodSleep) {
    discoveries.push(moodSleep);
  }

  for (const d of detectMoodCorrelations(data)) {
    if (discoveries.length >= 5) break;
    discoveries.push(d);
  }

  for (const d of detectSymptomPatterns(data, cycleCount)) {
    if (discoveries.length >= 6) break;
    if (discoveries.some((x) => x.id === d.id)) continue;
    discoveries.push(d);
  }

  return {
    ready: true,
    cycleCount,
    discoveries: discoveries.sort((a, b) => a.kind.localeCompare(b.kind)),
  };
}
