import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './dates';

const DAWN_PREFIX = 'floraison_dawn_seen:';
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

export async function clearCreativeLocal(userId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(
      (k) =>
        k.startsWith(`${DAWN_PREFIX}${userId}`) ||
        k === `${HERBIER_PREFIX}${userId}` ||
        k === `floraison_plant_letters:${userId}`,
    );
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {
    /* ignore */
  }
}
