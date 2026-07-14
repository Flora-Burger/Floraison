import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { removeStoredPin } from './pinStorage';
import { DEFAULT_NOTIFICATION_PREFS, saveNotificationPrefs } from './notificationPrefs';
import { cancelAllReminders } from './notifications';

const ONBOARDING_KEY = 'floraison_onboarding_done';

export async function clearLocalUserData(): Promise<void> {
  await removeStoredPin();
  await saveNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
  await cancelAllReminders();
  await AsyncStorage.multiRemove([ONBOARDING_KEY, 'floraison_notification_prefs']);
}

export async function deleteUserAccount(
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: dataError } = await client.from('cycle_data').delete().eq('user_id', userId);
  if (dataError) {
    return {
      ok: false,
      message: `Impossible de supprimer vos données : ${dataError.message}`,
    };
  }

  const { error: rpcError } = await client.rpc('delete_own_account');
  if (rpcError) {
    await client.auth.signOut();
    await clearLocalUserData();
    return {
      ok: false,
      message:
        'Vos données de cycle ont été supprimées, mais la fermeture du compte a échoué. Déconnectez-vous et contactez le support si le compte existe encore.',
    };
  }

  await clearLocalUserData();
  await client.auth.signOut();
  return { ok: true };
}
