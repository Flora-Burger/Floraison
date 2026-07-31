import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { CycleData } from '../types/cycle';
import { addDays, todayKey } from './dates';
import { getNextPeriodStartDate } from './cyclePredictions';
import { isEmptyDayEntry } from './cycleInsights';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from './notificationPrefs';
import {
  parseNotificationNavData,
  type NotificationNavData,
} from './notificationNav';

export type { NotificationNavData };
export { parseNotificationNavData };

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

/**
 * Écoute les taps sur notifs (froid + chaud).
 * Appelle `onNavigate` puis efface la dernière réponse pour éviter les rejoues.
 */
export function subscribeNotificationNavigation(
  onNavigate: (nav: NotificationNavData) => void,
): () => void {
  if (Platform.OS === 'web') return () => {};

  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const nav = parseNotificationNavData(response.notification.request.content.data);
    if (!nav) return;
    onNavigate(nav);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };

  void Notifications.getLastNotificationResponseAsync()
    .then(handle)
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}

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

/**
 * Rappel doux : une occurrence DATE (ce soir ou demain),
 * annulée / replanifiée si le jour a déjà un log.
 */
export async function scheduleDailyReminder(
  hour: number,
  data: CycleData,
): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelScheduled(DAILY_ID);

  const today = todayKey();
  const loggedToday = Boolean(data[today] && !isEmptyDayEntry(data[today]!));

  const target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (loggedToday || target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
    target.setHours(hour, 0, 0, 0);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'Floraison',
      body: 'Ta plante t’attend si tu as une minute — un petit log suffit.',
      data: { screen: 'suivi', action: 'log' } satisfies NotificationNavData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
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
          ? 'Préparation douce : tes règles pourraient commencer demain — note-les si elles arrivent.'
          : `Préparation douce : tes règles pourraient commencer dans ${daysBefore} jours — à toi de voir.`,
      data: { screen: 'suivi', action: 'period' } satisfies NotificationNavData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await cancelScheduled(DAILY_ID);
  await cancelScheduled(PERIOD_ID);
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
    if (ok) await scheduleDailyReminder(prefs.dailyHour, data);
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
