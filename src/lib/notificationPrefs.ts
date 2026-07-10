import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationPrefs = {
  dailyEnabled: boolean;
  dailyHour: number;
  periodEnabled: boolean;
  periodDaysBefore: number;
};

const KEY = 'floraison_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dailyEnabled: false,
  dailyHour: 20,
  periodEnabled: true,
  periodDaysBefore: 2,
};

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
