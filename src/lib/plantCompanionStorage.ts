import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CyclePhaseId } from '../types/cycle';
import type { PlantPhaseState } from './plantPhase';

const PREFIX = 'floraison_plant_state:';

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export async function loadPlantCompanionState(
  userId: string,
): Promise<PlantPhaseState | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { phase?: CyclePhaseId; progression?: number };
    if (
      !parsed.phase ||
      typeof parsed.progression !== 'number' ||
      !['menstruelle', 'folliculaire', 'ovulatoire', 'luteale'].includes(parsed.phase)
    ) {
      return null;
    }
    return {
      phase: parsed.phase,
      progression: Math.min(1, Math.max(0, parsed.progression)),
    };
  } catch {
    return null;
  }
}

export async function savePlantCompanionState(
  userId: string,
  state: PlantPhaseState,
): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(state));
}

export async function clearPlantCompanionState(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
