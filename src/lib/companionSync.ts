import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlantGalleryState } from './plantRarity';
import { loadPlantGallery, savePlantGallery } from './plantRarity';
import type { LastDailyMessageRecord } from './dailyMessageStorage';
import {
  loadLastDailyMessage,
  saveLastDailyMessage,
} from './dailyMessageStorage';

type CompanionRow = {
  rarity: PlantGalleryState;
  daily_message: LastDailyMessageRecord | null;
  updated_at: string;
};

/** Fusionne galerie distante + locale (union cycles, raretés, espèces). */
export function mergeGalleries(
  local: PlantGalleryState,
  remote: PlantGalleryState,
): PlantGalleryState {
  const byCycle = { ...remote.byCycle, ...local.byCycle };
  // Si même cycle des deux côtés, garder le plus récent seenAt
  for (const key of Object.keys(remote.byCycle)) {
    const r = remote.byCycle[key]!;
    const l = local.byCycle[key];
    if (l && r.seenAt > l.seenAt) byCycle[key] = r;
  }
  const seenVariants = new Set([
    ...(remote.seenVariants ?? []),
    ...(local.seenVariants ?? []),
  ]);
  const seenSpecies = new Set([
    ...(remote.seenSpecies ?? []),
    ...(local.seenSpecies ?? []),
  ]);
  for (const rec of Object.values(byCycle)) {
    if (rec.speciesId) seenSpecies.add(rec.speciesId);
  }
  return {
    byCycle,
    seenVariants: Array.from(seenVariants),
    seenSpecies: Array.from(seenSpecies),
  };
}

export async function pullCompanionState(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('user_companion')
    .select('rarity, daily_message, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return;

  const row = data as CompanionRow;
  const localGallery = await loadPlantGallery(userId);
  const remoteGallery =
    row.rarity && typeof row.rarity === 'object'
      ? (row.rarity as PlantGalleryState)
      : { byCycle: {}, seenVariants: [] };
  const merged = mergeGalleries(localGallery, remoteGallery);
  await savePlantGallery(userId, merged);

  if (row.daily_message?.messageId && row.daily_message?.date) {
    const local = await loadLastDailyMessage(userId);
    if (!local || row.daily_message.date >= local.date) {
      await saveLastDailyMessage(userId, row.daily_message);
    }
  }
}

export async function pushCompanionState(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const rarity = await loadPlantGallery(userId);
  const daily_message = await loadLastDailyMessage(userId);
  await supabase.from('user_companion').upsert(
    {
      user_id: userId,
      rarity,
      daily_message,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
