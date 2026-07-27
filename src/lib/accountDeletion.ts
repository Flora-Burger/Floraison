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

/**
 * Suppression atomique via RPC (cycle_data en cascade + auth.users).
 * Ne pas supprimer cycle_data avant le RPC : en cas d'échec on garderait un compte sans données.
 */
export async function deleteUserAccount(
  client: SupabaseClient,
  _userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: rpcError } = await client.rpc('delete_own_account');
  if (rpcError) {
    return {
      ok: false,
      message: `Impossible de supprimer le compte : ${rpcError.message}. Vos données sont intactes — réessayez ou contactez le support.`,
    };
  }

  await clearLocalUserData();
  await client.auth.signOut();
  return { ok: true };
}
