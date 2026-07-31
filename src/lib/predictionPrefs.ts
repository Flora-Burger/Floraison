import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CycleData } from '../types/cycle';
import { getCycleRegularity } from './cycleMath';

const KEY = 'floraison_prediction_prefs';

export type PredictionPrefs = {
  /** Utilisatrice a mis les prédictions calendrier en pause. */
  pausePredictions: boolean;
};

export const DEFAULT_PREDICTION_PREFS: PredictionPrefs = {
  pausePredictions: false,
};

export async function loadPredictionPrefs(): Promise<PredictionPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREDICTION_PREFS };
    return { ...DEFAULT_PREDICTION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREDICTION_PREFS };
  }
}

export async function savePredictionPrefs(prefs: PredictionPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

export async function clearPredictionPrefs(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/** Pause manuelle ou cycles très irréguliers (mode doux auto). */
export function shouldPausePredictions(
  data: CycleData,
  prefs: PredictionPrefs,
): boolean {
  if (prefs.pausePredictions) return true;
  return getCycleRegularity(data).status === 'irregular';
}

export function predictionPauseReason(
  data: CycleData,
  prefs: PredictionPrefs,
): 'manual' | 'irregular' | null {
  if (prefs.pausePredictions) return 'manual';
  if (getCycleRegularity(data).status === 'irregular') return 'irregular';
  return null;
}
