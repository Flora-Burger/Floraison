import type { CycleData } from '../types/cycle';
import { MOOD_OPTIONS } from '../constants/symptoms';
import { getPeriodStarts, getCycleRegularity, computeAvgCycleLength } from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';
import { computeSymptomCorrelations } from './cycleInsights';
import { todayKey } from './dates';
import { isPeriodDueOrLate, getPeriodOverdueDays } from './periodTiming';

export type CycleThreeLineSummary = {
  line1: string;
  line2: string;
  line3: string;
};

/** Résumé factuel du cycle en cours — 3 lignes max. */
export function getCycleThreeLineSummary(
  data: CycleData,
  date: string = todayKey(),
): CycleThreeLineSummary | null {
  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return null;

  const avg = computeAvgCycleLength(data);
  const regularity = getCycleRegularity(data);
  const overdue = isPeriodDueOrLate(data, date);
  const overdueDays = getPeriodOverdueDays(data, date);

  const line1 = overdue
    ? overdueDays > 0
      ? `Cycle en cours : jour ${ctx.cycleDay} · règles en retard de ${overdueDays} j`
      : `Cycle en cours : jour ${ctx.cycleDay} · règles attendues aujourd’hui`
    : `Cycle en cours : jour ${ctx.cycleDay} / ~${avg} j · phase ${ctx.phase}`;

  const { heroInsight } = computeSymptomCorrelations(data);
  const line2 = heroInsight
    ? `Symptôme marquant : ${heroInsight.label} (${Math.round(heroInsight.rate * 100)} % en ${heroInsight.phase === 'avant_regles' ? 'fin de cycle' : heroInsight.phase})`
    : 'Symptômes : pas encore de motif net sur tes logs';

  const moodCounts: Record<string, number> = {};
  for (const entry of Object.values(data) as import('../types/cycle').DayEntry[]) {
    for (const m of entry.mood ?? []) {
      moodCounts[m] = (moodCounts[m] ?? 0) + 1;
    }
  }
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const moodLabel = topMood
    ? (MOOD_OPTIONS.find((m) => m.id === topMood[0])?.label ?? topMood[0])
    : null;
  const line3 = moodLabel
    ? `Humeur la plus notée : ${moodLabel.toLowerCase()} (${topMood![1]} jour${topMood![1] > 1 ? 's' : ''}) · ${regularity.label}`
    : `Humeur : encore peu de notes · ${regularity.label}`;

  return { line1, line2, line3 };
}

export function formatDoctorBrief(data: CycleData, date: string = todayKey()): string {
  const starts = getPeriodStarts(data);
  const summary = getCycleThreeLineSummary(data, date);
  const avg = computeAvgCycleLength(data);
  const regularity = getCycleRegularity(data);
  const lines = [
    'Floraison — résumé pour consultation',
    `Cycles enregistrés : ${starts.length}`,
    `Durée moyenne : ~${avg} jours`,
    `Régularité : ${regularity.label}`,
  ];
  if (summary) {
    lines.push(summary.line1, summary.line2, summary.line3);
  }
  lines.push('', 'Document indicatif — ne remplace pas un avis médical.');
  return lines.join('\n');
}
