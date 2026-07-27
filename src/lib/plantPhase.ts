import type { CycleData, CyclePhaseId } from '../types/cycle';
import { daysBetween } from './dates';
import { getCycleContextForDate } from './cyclePhase';

export type CycleConfig = {
  dureeCycleMoyenne: number;
  dureeRegles: number;
  dureeOvulatoire: number;
  dureeLuteale: number;
  dateDebutDernieresRegles: string;
};

export type PlantPhaseState = {
  phase: CyclePhaseId;
  progression: number;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function phaseProgress(dayInPhase: number, duration: number): number {
  if (duration <= 1) return 1;
  return clamp01((dayInPhase - 1) / (duration - 1));
}

/**
 * Calcule la phase courante et la progression (0–1) dans cette phase.
 * dureeFolliculaire = dureeCycleMoyenne - dureeRegles - dureeOvulatoire - dureeLuteale.
 */
export function getPhaseEtProgression(
  dateAujourdhui: string,
  cycleConfig: CycleConfig,
): PlantPhaseState {
  const dureeCycle = Math.max(1, Math.round(cycleConfig.dureeCycleMoyenne));
  const dureeRegles = Math.max(1, Math.round(cycleConfig.dureeRegles));
  const dureeOvulatoire = Math.max(1, Math.round(cycleConfig.dureeOvulatoire));
  const dureeLuteale = Math.max(1, Math.round(cycleConfig.dureeLuteale));
  const dureeFolliculaire = Math.max(
    0,
    dureeCycle - dureeRegles - dureeOvulatoire - dureeLuteale,
  );

  let cycleDay = daysBetween(cycleConfig.dateDebutDernieresRegles, dateAujourdhui) + 1;
  if (cycleDay < 1) cycleDay = 1;
  if (cycleDay > dureeCycle) {
    return { phase: 'luteale', progression: 1 };
  }

  const segments: { phase: CyclePhaseId; duration: number }[] = [
    { phase: 'menstruelle', duration: dureeRegles },
    { phase: 'folliculaire', duration: dureeFolliculaire },
    { phase: 'ovulatoire', duration: dureeOvulatoire },
    { phase: 'luteale', duration: dureeLuteale },
  ];

  let cursor = 1;
  for (const seg of segments) {
    if (seg.duration <= 0) continue;
    const end = cursor + seg.duration - 1;
    if (cycleDay >= cursor && cycleDay <= end) {
      const dayInPhase = cycleDay - cursor + 1;
      return {
        phase: seg.phase,
        progression: phaseProgress(dayInPhase, seg.duration),
      };
    }
    cursor = end + 1;
  }

  return { phase: 'luteale', progression: 1 };
}

/** Construit une CycleConfig depuis les données suivi (moyennes + dernier début de règles). */
export function cycleConfigFromData(
  data: CycleData,
  date: string,
): CycleConfig | null {
  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return null;

  return {
    dureeCycleMoyenne: ctx.cycleLength,
    dureeRegles: ctx.periodDays,
    dureeOvulatoire: Math.max(1, ctx.segmentDays.ovulatoire),
    dureeLuteale: Math.max(1, ctx.segmentDays.luteale),
    dateDebutDernieresRegles: ctx.periodStart,
  };
}

export function getPlantPhaseFromData(
  data: CycleData,
  date: string,
): PlantPhaseState | null {
  const config = cycleConfigFromData(data, date);
  if (!config) return null;
  return getPhaseEtProgression(date, config);
}

export function plantStatesEqual(a: PlantPhaseState, b: PlantPhaseState): boolean {
  return (
    a.phase === b.phase && Math.abs(a.progression - b.progression) < 0.001
  );
}
