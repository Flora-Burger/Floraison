import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSpecies,
  rollFlowerSpecies,
  speciesFromLegacyVariante,
  type FlowerSpeciesId,
} from '../constants/flowerSpecies';
import {
  pickSignatureSpecies,
  resolveAlbumSeason,
  type AlbumSeason,
} from '../constants/albumSeason';

export type FlowerVariante = 'commune' | 'rare' | 'tres_rare';

export type FlowerVariantRecord = {
  cycleStart: string;
  variante: FlowerVariante;
  /** Espèce nommée (collection). Absente sur les anciens tirages. */
  speciesId?: FlowerSpeciesId;
  seenAt: string;
  badgeDismissed?: boolean;
};

export type PlantGalleryState = {
  byCycle: Record<string, FlowerVariantRecord>;
  seenVariants: FlowerVariante[];
  /** Espèces découvertes (collection). */
  seenSpecies?: FlowerSpeciesId[];
};

const PREFIX = 'floraison_plant_rarity:';

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

function emptyGallery(): PlantGalleryState {
  return { byCycle: {}, seenVariants: [], seenSpecies: [] };
}

/** @deprecated préférer rollFlowerSpecies — gardé pour tests / compat. */
export function rollFlowerVariant(): FlowerVariante {
  return rollFlowerSpecies().rarity;
}

function normalizeGallery(parsed: PlantGalleryState): PlantGalleryState {
  const byCycle = parsed.byCycle ?? {};
  const seenVariants = Array.isArray(parsed.seenVariants) ? parsed.seenVariants : [];
  const seenSpecies = new Set<FlowerSpeciesId>(
    Array.isArray(parsed.seenSpecies) ? parsed.seenSpecies : [],
  );
  for (const rec of Object.values(byCycle)) {
    const sid = rec.speciesId ?? speciesFromLegacyVariante(rec.variante);
    seenSpecies.add(sid);
  }
  return {
    byCycle,
    seenVariants,
    seenSpecies: Array.from(seenSpecies),
  };
}

export async function loadPlantGallery(
  userId: string,
): Promise<PlantGalleryState> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return emptyGallery();
    const parsed = JSON.parse(raw) as PlantGalleryState;
    if (!parsed?.byCycle || typeof parsed.byCycle !== 'object') {
      return emptyGallery();
    }
    return normalizeGallery(parsed);
  } catch {
    return emptyGallery();
  }
}

export async function savePlantGallery(
  userId: string,
  state: PlantGalleryState,
): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(normalizeGallery(state)));
}

export async function clearPlantGallery(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}

/** Fenêtre de tirage : ovulatoire avec progression ~0.5 (une fois / cycle). */
export function shouldRollFlowerVariant(
  phase: string,
  progression: number,
  cycleStart: string | null | undefined,
  gallery: PlantGalleryState,
): boolean {
  if (!cycleStart) return false;
  if (phase !== 'ovulatoire') return false;
  if (progression < 0.35 || progression > 0.75) return false;
  return !gallery.byCycle[cycleStart];
}

export async function ensureFlowerVariantForCycle(
  userId: string,
  cycleStart: string,
  phase: string,
  progression: number,
): Promise<FlowerVariantRecord | null> {
  const gallery = await loadPlantGallery(userId);
  const existing = gallery.byCycle[cycleStart];
  if (existing) {
    // Backfill speciesId si manquant
    if (!existing.speciesId) {
      const sid = speciesFromLegacyVariante(existing.variante);
      const patched = { ...existing, speciesId: sid };
      gallery.byCycle[cycleStart] = patched;
      gallery.seenSpecies = Array.from(
        new Set([...(gallery.seenSpecies ?? []), sid]),
      );
      await savePlantGallery(userId, gallery);
      return patched;
    }
    return existing;
  }

  if (!shouldRollFlowerVariant(phase, progression, cycleStart, gallery)) {
    return null;
  }

  const species = rollFlowerSpecies();
  const record: FlowerVariantRecord = {
    cycleStart,
    variante: species.rarity,
    speciesId: species.id,
    seenAt: new Date().toISOString(),
  };
  const seenVariants = gallery.seenVariants.includes(species.rarity)
    ? gallery.seenVariants
    : [...gallery.seenVariants, species.rarity];
  const seenSpecies = gallery.seenSpecies?.includes(species.id)
    ? gallery.seenSpecies
    : [...(gallery.seenSpecies ?? []), species.id];
  const next: PlantGalleryState = {
    byCycle: { ...gallery.byCycle, [cycleStart]: record },
    seenVariants,
    seenSpecies,
  };
  await savePlantGallery(userId, next);
  return record;
}

export async function dismissFlowerBadge(
  userId: string,
  cycleStart: string,
): Promise<void> {
  const gallery = await loadPlantGallery(userId);
  const record = gallery.byCycle[cycleStart];
  if (!record || record.badgeDismissed) return;
  gallery.byCycle[cycleStart] = { ...record, badgeDismissed: true };
  await savePlantGallery(userId, gallery);
}

export function getFlowerVariantForCycle(
  gallery: PlantGalleryState,
  cycleStart: string | null | undefined,
): FlowerVariante {
  if (!cycleStart) return 'commune';
  return gallery.byCycle[cycleStart]?.variante ?? 'commune';
}

export function getFlowerSpeciesIdForCycle(
  gallery: PlantGalleryState,
  cycleStart: string | null | undefined,
): FlowerSpeciesId {
  if (!cycleStart) return 'capucine';
  const rec = gallery.byCycle[cycleStart];
  if (!rec) return 'capucine';
  return rec.speciesId ?? speciesFromLegacyVariante(rec.variante);
}

export function resolveRecordSpecies(record: FlowerVariantRecord) {
  return getSpecies(record.speciesId, record.variante);
}

export function galleryBloomCount(gallery: PlantGalleryState): number {
  return Object.keys(gallery.byCycle).length;
}

export function galleryAlbumSeason(gallery: PlantGalleryState): AlbumSeason {
  return resolveAlbumSeason(galleryBloomCount(gallery));
}

/** Espèce affichée hors tirage du cycle : signature, sinon défaut. */
export function resolveDisplaySpecies(
  gallery: PlantGalleryState,
  cycleStart: string | null | undefined,
): { speciesId: FlowerSpeciesId; variante: FlowerVariante; name: string; isSignature: boolean } {
  if (cycleStart && gallery.byCycle[cycleStart]) {
    const rec = gallery.byCycle[cycleStart]!;
    const species = resolveRecordSpecies(rec);
    return {
      speciesId: species.id,
      variante: rec.variante,
      name: species.name,
      isSignature: false,
    };
  }
  const byCycleIds = Object.values(gallery.byCycle).map(
    (r) => r.speciesId ?? speciesFromLegacyVariante(r.variante),
  );
  const sig = pickSignatureSpecies(gallery.seenSpecies ?? [], byCycleIds);
  if (sig) {
    return {
      speciesId: sig.id,
      variante: sig.variante,
      name: sig.name,
      isSignature: true,
    };
  }
  return {
    speciesId: 'capucine',
    variante: 'commune',
    name: 'Capucine',
    isSignature: false,
  };
}
