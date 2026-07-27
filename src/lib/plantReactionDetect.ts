import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CycleData, DayEntry, Flow, MoodTag, PhysicalSymptom } from '../types/cycle';
import {
  pickReaction,
  type PlantReaction,
  type ReactionCategory,
} from '../constants/plantReactions';
import { addDays, daysBetween, todayKey } from './dates';
import { isEmptyDayEntry } from './cycleInsights';

const FIRST_LOG_PREFIX = 'floraison_first_log:';
const LAST_OPEN_PREFIX = 'floraison_last_open:';
const RECENT_PREFIX = 'floraison_plant_reactions_recent:';
const ABSENCE_SESSION_PREFIX = 'floraison_absence_pending:';

const INTENSE_FLOW: Flow[] = ['fort', 'tres_abondant'];
const INTENSE_PHYSICAL: PhysicalSymptom[] = [
  'crampes',
  'migraine',
  'douleurs_dos',
  'nausees',
  'vertiges',
];
const INTENSE_MOOD: MoodTag[] = ['irritable', 'anxieuse', 'triste', 'stressee'];

const STREAK_MIN = 3;
const ABSENCE_DAYS = 3;

function firstLogKey(userId: string, date: string): string {
  return `${FIRST_LOG_PREFIX}${userId}:${date}`;
}

function lastOpenKey(userId: string): string {
  return `${LAST_OPEN_PREFIX}${userId}`;
}

function recentKey(userId: string): string {
  return `${RECENT_PREFIX}${userId}`;
}

function absencePendingKey(userId: string): string {
  return `${ABSENCE_SESSION_PREFIX}${userId}`;
}

export function isIntenseSymptomPatch(patch: Partial<DayEntry>, merged: DayEntry): boolean {
  if (merged.flow && INTENSE_FLOW.includes(merged.flow)) return true;
  if (patch.flow && INTENSE_FLOW.includes(patch.flow)) return true;
  const physical = merged.physical ?? [];
  if (physical.some((p) => INTENSE_PHYSICAL.includes(p))) return true;
  const mood = merged.mood ?? [];
  if (mood.some((m) => INTENSE_MOOD.includes(m))) return true;
  return false;
}

/** Jours consécutifs avec au moins une entrée, en remontant depuis `fromDate`. */
export function countConsecutiveLoggedDays(
  data: CycleData,
  fromDate: string,
): number {
  let count = 0;
  let cursor = fromDate;
  for (let i = 0; i < 60; i++) {
    const entry = data[cursor];
    if (!entry || isEmptyDayEntry(entry)) break;
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

async function loadRecentIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(recentKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(-8) : [];
  } catch {
    return [];
  }
}

async function pushRecentId(userId: string, id: string): Promise<void> {
  const recent = await loadRecentIds(userId);
  recent.push(id);
  await AsyncStorage.setItem(
    recentKey(userId),
    JSON.stringify(recent.slice(-8)),
  );
}

/**
 * À l'ouverture de l'app : met à jour lastOpen et flagge une éventuelle absence ≥ 3 jours.
 */
export async function notePlantAppOpen(userId: string): Promise<void> {
  const today = todayKey();
  const k = lastOpenKey(userId);
  try {
    const prev = await AsyncStorage.getItem(k);
    if (prev && daysBetween(prev, today) >= ABSENCE_DAYS) {
      await AsyncStorage.setItem(absencePendingKey(userId), '1');
    }
    await AsyncStorage.setItem(k, today);
  } catch {
    /* ignore */
  }
}

export async function clearPlantReactionFlags(userId: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      lastOpenKey(userId),
      absencePendingKey(userId),
      recentKey(userId),
    ]);
  } catch {
    /* ignore */
  }
}

export type DetectPlantReactionArgs = {
  userId: string;
  date: string;
  prevData: CycleData;
  nextData: CycleData;
  patch: Partial<DayEntry>;
  merged: DayEntry;
  wasEmpty: boolean;
};

/**
 * Détermine une catégorie de réaction (priorité : intense > premier jour > absence > streak).
 * Une seule réaction à la fois.
 */
export async function detectPlantReaction(
  args: DetectPlantReactionArgs,
): Promise<PlantReaction | null> {
  const { userId, date, nextData, patch, merged, wasEmpty } = args;
  if (isEmptyDayEntry(merged)) return null;

  const today = todayKey();
  const categories: ReactionCategory[] = [];

  if (isIntenseSymptomPatch(patch, merged)) {
    categories.push('symptomeIntense');
  }

  if (date === today) {
    const already = await AsyncStorage.getItem(firstLogKey(userId, today));
    if (!already && wasEmpty) {
      categories.push('premierLogDuJour');
      await AsyncStorage.setItem(firstLogKey(userId, today), '1');
    }

    const absencePending = await AsyncStorage.getItem(absencePendingKey(userId));
    if (absencePending === '1') {
      categories.push('logApresAbsence');
      await AsyncStorage.removeItem(absencePendingKey(userId));
    }
  }

  const streak = countConsecutiveLoggedDays(nextData, date);
  if (streak >= STREAK_MIN) {
    categories.push('streakLongue');
  }

  if (categories.length === 0) return null;

  // Une réaction : prioriser intense, sinon premier du jour, absence, streak
  const order: ReactionCategory[] = [
    'symptomeIntense',
    'premierLogDuJour',
    'logApresAbsence',
    'streakLongue',
  ];
  const chosen = order.find((c) => categories.includes(c))!;
  const recent = await loadRecentIds(userId);
  const reaction = pickReaction(chosen, recent);
  await pushRecentId(userId, reaction.id);
  return reaction;
}
