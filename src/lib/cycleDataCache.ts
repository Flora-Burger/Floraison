import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CycleData } from '../types/cycle';
import { migrateCycleData } from './dayEntry';

const CACHE_PREFIX = 'floraison_cycle_v1:';

function cacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`;
}

export async function loadCachedCycleData(userId: string): Promise<CycleData | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CycleData;
    if (!parsed || typeof parsed !== 'object') return null;
    return migrateCycleData(parsed);
  } catch {
    return null;
  }
}

export async function saveCachedCycleData(userId: string, data: CycleData): Promise<void> {
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(data));
}

export async function clearCachedCycleData(userId: string): Promise<void> {
  await AsyncStorage.removeItem(cacheKey(userId));
}
