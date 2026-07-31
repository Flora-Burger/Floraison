import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { removeStoredPin } from './pinStorage';
import { DEFAULT_NOTIFICATION_PREFS, saveNotificationPrefs } from './notificationPrefs';
import { cancelAllReminders } from './notifications';
import { clearPlantCompanionState } from './plantCompanionStorage';
import { clearPlantGallery } from './plantRarity';
import { clearPlantReactionFlags } from './plantReactionDetect';
import { clearLastDailyMessage } from './dailyMessageStorage';
import { clearSecondCycleNudge } from './secondCycleNudgeStorage';
import { clearCachedCycleData } from './cycleDataCache';
import { clearPhaseNotes } from './phaseNotesStorage';
import { clearPredictionPrefs } from './predictionPrefs';
import { clearCreativeLocal } from './creativeStorage';

const ONBOARDING_KEY = 'floraison_onboarding_done';

/** Nettoie tout le stockage local lié à un compte (ou à la session). */
export async function clearLocalUserData(userId?: string): Promise<void> {
  await removeStoredPin();
  await saveNotificationPrefs(DEFAULT_NOTIFICATION_PREFS);
  await cancelAllReminders();
  await clearSecondCycleNudge();
  await AsyncStorage.multiRemove([ONBOARDING_KEY, 'floraison_notification_prefs']);
  if (userId) {
    await clearCachedCycleData(userId);
    await clearPlantCompanionState(userId);
    await clearPlantGallery(userId);
    await clearPlantReactionFlags(userId);
    await clearLastDailyMessage(userId);
    await clearPhaseNotes(userId);
    await clearCreativeLocal(userId);
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
