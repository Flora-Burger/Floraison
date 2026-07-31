import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'floraison_second_cycle_nudge_seen';

export async function hasSeenSecondCycleNudge(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markSecondCycleNudgeSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

export async function clearSecondCycleNudge(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
