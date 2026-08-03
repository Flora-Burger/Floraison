import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { removeStoredPin } from './pinStorage';
import { DEFAULT_NOTIFICATION_PREFS, saveNotificationPrefs } from './notificationPrefs';
import { cancelAllReminders } from './notifications';
import { clearCachedCycleData } from './cycleDataCache';
import { clearPredictionPrefs } from './predictionPrefs';

const ONBOARDING_KEY = 'floraison_onboarding_done';

/** Nettoie le stockage local lié à un compte (ou à la session). */
export async function clearLocalUserData(userId?: string): Promise<void> {
  await removeStoredPin();
  await saveNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
  await cancelAllReminders();
  await AsyncStorage.multiRemove([ONBOARDING_KEY, 'floraison_notification_prefs']);
  if (userId) {
    await clearCachedCycleData(userId);
    // Anciennes clés lore / plante (si présentes)
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stale = keys.filter(
        (k) =>
          k.startsWith(`floraison_plant_`) ||
          k.startsWith(`floraison_dawn_`) ||
          k.startsWith(`floraison_herbier:`) ||
          k.startsWith(`floraison_phase_notes:`) ||
          k.startsWith(`floraison_daily_message:`) ||
          k.startsWith(`floraison_plant_rarity:`) ||
          k.startsWith(`floraison_plant_companion:`) ||
          k === 'floraison_second_cycle_nudge',
      );
      if (stale.length) await AsyncStorage.multiRemove(stale);
    } catch {
      /* ignore */
    }
  }
  await clearPredictionPrefs();
}

/**
 * Suppression atomique via RPC (cycle_data en cascade + auth.users).
 * Ne pas supprimer cycle_data avant le RPC : en cas d'échec on garderait un compte sans données.
 */
export async function deleteUserAccount(
  client: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: rpcError } = await client.rpc('delete_own_account');
  if (rpcError) {
    return {
      ok: false,
      message: `Impossible de supprimer le compte : ${rpcError.message}. Vos données sont intactes — réessayez ou contactez le support.`,
    };
  }

  await clearLocalUserData(userId);
  await client.auth.signOut();
  return { ok: true };
}
