import AsyncStorage from '@react-native-async-storage/async-storage';

export const PIN_KEY = '@clue_pin';

export async function getStoredPin(): Promise<string | null> {
  return AsyncStorage.getItem(PIN_KEY);
}

export async function setStoredPin(pin: string): Promise<void> {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

export async function removeStoredPin(): Promise<void> {
  await AsyncStorage.removeItem(PIN_KEY);
}
