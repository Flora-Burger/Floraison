import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CyclePhaseId } from '../types/cycle';
import { todayKey } from './dates';

const DAWN_PREFIX = 'floraison_dawn_seen:';
const LETTERS_PREFIX = 'floraison_plant_letters:';
const HERBIER_PREFIX = 'floraison_herbier:';

function dawnKey(userId: string, date: string): string {
  return `${DAWN_PREFIX}${userId}:${date}`;
}

export async function hasSeenDawnRitual(userId: string, date = todayKey()): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(dawnKey(userId, date))) === '1';
  } catch {
    return false;
  }
}

export async function markDawnRitualSeen(userId: string, date = todayKey()): Promise<void> {
  await AsyncStorage.setItem(dawnKey(userId, date), '1');
}

export type PlantLetter = {
  id: string;
  date: string;
  fromUser: string;
  fromPlant: string;
  phase: CyclePhaseId;
};

export async function loadPlantLetters(userId: string): Promise<PlantLetter[]> {
  try {
    const raw = await AsyncStorage.getItem(`${LETTERS_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlantLetter[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function savePlantLetter(
  userId: string,
  letter: Omit<PlantLetter, 'id'>,
): Promise<PlantLetter[]> {
  const current = await loadPlantLetters(userId);
  const next: PlantLetter[] = [
    { ...letter, id: `${letter.date}-${Date.now()}` },
    ...current,
  ].slice(0, 12);
  await AsyncStorage.setItem(`${LETTERS_PREFIX}${userId}`, JSON.stringify(next));
  return next;
}

export async function clearPlantLetters(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${LETTERS_PREFIX}${userId}`);
}

export type HerbierEntry = {
  id: string;
  verse: string;
  phase: CyclePhaseId;
  pressedAt: string;
};

export async function loadHerbier(userId: string): Promise<HerbierEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(`${HERBIER_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HerbierEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 24) : [];
  } catch {
    return [];
  }
}

export async function pressVerseIntoHerbier(
  userId: string,
  verse: string,
  phase: CyclePhaseId,
): Promise<{ entries: HerbierEntry[]; added: boolean }> {
  const entries = await loadHerbier(userId);
  if (entries.some((e) => e.verse === verse)) {
    return { entries, added: false };
  }
  const next: HerbierEntry[] = [
    {
      id: `${todayKey()}-${phase}-${entries.length}`,
      verse,
      phase,
      pressedAt: todayKey(),
    },
    ...entries,
  ].slice(0, 24);
  await AsyncStorage.setItem(`${HERBIER_PREFIX}${userId}`, JSON.stringify(next));
  return { entries: next, added: true };
}

export async function clearHerbier(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${HERBIER_PREFIX}${userId}`);
}

export async function clearCreativeLocal(userId: string): Promise<void> {
  await clearPlantLetters(userId);
  await clearHerbier(userId);
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dawnKeys = keys.filter((k) => k.startsWith(`${DAWN_PREFIX}${userId}`));
    if (dawnKeys.length) await AsyncStorage.multiRemove(dawnKeys);
  } catch {
    /* ignore */
  }
}
