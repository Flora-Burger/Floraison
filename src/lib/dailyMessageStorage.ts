import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'floraison_daily_msg_last:';

export type LastDailyMessageRecord = {
  messageId: string;
  date: string;
};

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export async function loadLastDailyMessage(
  userId: string,
): Promise<LastDailyMessageRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastDailyMessageRecord;
    if (!parsed?.messageId || !parsed?.date) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveLastDailyMessage(
  userId: string,
  record: LastDailyMessageRecord,
): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(record));
}

export async function clearLastDailyMessage(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
