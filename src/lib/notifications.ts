import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { CycleData } from '../types/cycle';
import { addDays, todayKey } from './dates';
import { getNextPeriodStartDate } from './cyclePredictions';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from './notificationPrefs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAILY_ID = 'floraison-daily-reminder';
const PERIOD_ID = 'floraison-period-reminder';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelScheduled(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function scheduleDailyReminder(hour: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelScheduled(DAILY_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'Floraison',
      body: "Comment tu te sens aujourd'hui ? Note ton suivi en un instant.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function schedulePeriodReminder(
  data: CycleData,
  daysBefore: number,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelScheduled(PERIOD_ID);

  const nextPeriod = getNextPeriodStartDate(data, todayKey());
  if (!nextPeriod) return;

  const notifyDate = addDays(nextPeriod, -daysBefore);
  const triggerDate = new Date(`${notifyDate}T09:00:00`);
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: PERIOD_ID,
    content: {
      title: 'Floraison',
      body:
        daysBefore === 1
          ? 'Tes règles pourraient commencer demain — pense à les noter si elles arrivent.'
          : `Tes règles pourraient commencer dans ${daysBefore} jours — prépare ton suivi.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function syncAllReminders(data: CycleData): Promise<void> {
  if (Platform.OS === 'web') return;
  const prefs = await loadNotificationPrefs();
  await applyNotificationPrefs(prefs, data);
}

export async function applyNotificationPrefs(
  prefs: NotificationPrefs,
  data: CycleData,
): Promise<void> {
  if (Platform.OS === 'web') return;

  if (prefs.dailyEnabled) {
    const ok = await requestNotificationPermission();
    if (ok) await scheduleDailyReminder(prefs.dailyHour);
    else await cancelScheduled(DAILY_ID);
  } else {
    await cancelScheduled(DAILY_ID);
  }

  if (prefs.periodEnabled) {
    const ok = await requestNotificationPermission();
    if (ok) await schedulePeriodReminder(data, prefs.periodDaysBefore);
    else await cancelScheduled(PERIOD_ID);
  } else {
    await cancelScheduled(PERIOD_ID);
  }
}

export async function enableDefaultReminders(data: CycleData): Promise<void> {
  if (Platform.OS === 'web') return;
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, dailyEnabled: true };
  await saveNotificationPrefs(prefs);
  await applyNotificationPrefs(prefs, data);
}
