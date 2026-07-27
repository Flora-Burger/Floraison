import AsyncStorage from '@react-native-async-storage/async-storage';

export type FlowerVariante = 'commune' | 'rare' | 'tres_rare';

export type FlowerVariantRecord = {
  cycleStart: string;
  variante: FlowerVariante;
  seenAt: string;
  badgeDismissed?: boolean;
};

export type PlantGalleryState = {
  byCycle: Record<string, FlowerVariantRecord>;
  seenVariants: FlowerVariante[];
};

const PREFIX = 'floraison_plant_rarity:';

const RARETE = [
  { variante: 'commune' as const, proba: 0.85 },
  { variante: 'rare' as const, proba: 0.12 },
  { variante: 'tres_rare' as const, proba: 0.03 },
];

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

function emptyGallery(): PlantGalleryState {
  return { byCycle: {}, seenVariants: [] };
}

export function rollFlowerVariant(): FlowerVariante {
  const r = Math.random();
  let acc = 0;
  for (const row of RARETE) {
    acc += row.proba;
    if (r < acc) return row.variante;
  }
  return 'commune';
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
    return {
      byCycle: parsed.byCycle,
      seenVariants: Array.isArray(parsed.seenVariants) ? parsed.seenVariants : [],
    };
  } catch {
    return emptyGallery();
  }
}

export async function savePlantGallery(
  userId: string,
  state: PlantGalleryState,
): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(state));
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
  if (progression < 0.4 || progression > 0.6) return false;
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
  if (existing) return existing;

  if (!shouldRollFlowerVariant(phase, progression, cycleStart, gallery)) {
    return null;
  }

  const variante = rollFlowerVariant();
  const record: FlowerVariantRecord = {
    cycleStart,
    variante,
    seenAt: new Date().toISOString(),
  };
  const seenVariants = gallery.seenVariants.includes(variante)
    ? gallery.seenVariants
    : [...gallery.seenVariants, variante];
  const next: PlantGalleryState = {
    byCycle: { ...gallery.byCycle, [cycleStart]: record },
    seenVariants,
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
