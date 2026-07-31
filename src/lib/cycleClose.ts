import type { CycleData, CyclePhaseId } from '../types/cycle';
import { getPhaseById } from '../constants/cycleContent';
import { daysBetween, todayKey } from './dates';
import {
  computeAvgCycleLength,
  getPeriodStarts,
} from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';

const FRIEND_PHASE_LABELS: Record<CyclePhaseId, string> = {
  menstruelle: 'Graine — repos',
  folliculaire: 'Pousse — énergie',
  ovulatoire: 'Floraison',
  luteale: 'Fruits — transition',
};

export type CycleCloseSummary = {
  previousStart: string;
  previousLength: number;
  averageLength: number;
  phaseAtClose: CyclePhaseId;
  lines: [string, string, string];
  companionLine: string;
};

const CLOSE_LINES = [
  'Un cycle se ferme, un autre s’ouvre — sans jugement.',
  'Tu as traversé ce mois : la plante repart avec toi.',
  'Clôture douce. Ce qui a été noté reste précieux.',
];

/**
 * Si `patch` vient d’ajouter un nouveau début de règles et qu’il y avait déjà
 * au moins un cycle, renvoie le résumé du cycle qui vient de se fermer.
 */
export function detectCycleClose(
  prevData: CycleData,
  nextData: CycleData,
  patch: { period?: boolean },
  date: string,
): CycleCloseSummary | null {
  if (patch.period !== true) return null;
  const before = getPeriodStarts(prevData);
  const after = getPeriodStarts(nextData);
  const newStarts = after.filter((s) => !before.includes(s));
  if (newStarts.length === 0 || before.length === 0) return null;
  if (!newStarts.includes(date)) return null;

  const previousStart = before[before.length - 1]!;
  const previousLength = daysBetween(previousStart, date);
  if (previousLength < 15 || previousLength > 60) return null;

  const averageLength = computeAvgCycleLength(prevData);
  const ctx = getCycleContextForDate(prevData, date);
  const phaseAtClose = ctx?.phase ?? 'luteale';
  const phaseLabel = getPhaseById(phaseAtClose).shortTitle.toLowerCase();

  const lines: [string, string, string] = [
    `Cycle précédent : ${previousLength} jours (début ${previousStart})`,
    `Ta moyenne : ~${averageLength} jours`,
    `Tu étais en ${phaseLabel} juste avant ce nouveau début`,
  ];

  const companionLine =
    CLOSE_LINES[Math.floor(Math.random() * CLOSE_LINES.length)]!;

  return {
    previousStart,
    previousLength,
    averageLength,
    phaseAtClose,
    lines,
    companionLine,
  };
}

export type FriendShareCard = {
  title: string;
  body: string;
};

/** Carte anonyme partageable — pas de dates ni symptômes médicaux. */
export function buildFriendShareCard(
  data: CycleData,
  date: string = todayKey(),
): FriendShareCard | null {
  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return null;
  const label = FRIEND_PHASE_LABELS[ctx.phase] ?? ctx.phase;
  return {
    title: 'Floraison',
    body: [
      `Aujourd’hui je suis en phase « ${label} ».`,
      'Ma plante m’accompagne — sans chiffres, juste le moment.',
      '',
      '— Partagé depuis Floraison (rien de médical)',
    ].join('\n'),
  };
}
