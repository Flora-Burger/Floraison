import type { CycleData } from '../types/cycle';
import type { NotificationPrefs } from './notificationPrefs';
import {
  parseNotificationNavData,
  type NotificationNavData,
} from './notificationNav';

export type { NotificationNavData };
export { parseNotificationNavData };

/** Web : pas de notifications locales (évite le warning push token d’expo-notifications). */

export function subscribeNotificationNavigation(
  _onNavigate: (nav: NotificationNavData) => void,
): () => void {
  return () => {};
}

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleDailyReminder(
  _hour: number,
  _data: CycleData,
): Promise<void> {}

export async function schedulePeriodReminder(
  _data: CycleData,
  _daysBefore: number,
): Promise<void> {}

export async function cancelAllReminders(): Promise<void> {}

export async function syncAllReminders(_data: CycleData): Promise<void> {}

export async function applyNotificationPrefs(
  _prefs: NotificationPrefs,
  _data: CycleData,
): Promise<void> {}

export async function enableDefaultReminders(_data: CycleData): Promise<void> {}
