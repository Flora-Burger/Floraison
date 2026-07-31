import type { FlowerSpeciesId } from './flowerSpecies';
import { FLOWER_SPECIES_BY_ID, getSpecies } from './flowerSpecies';
import type { FlowerVariante } from '../lib/plantRarity';

/** Saison visuelle de l’album / pot — débloquée au fil des cycles. */
export type AlbumSeasonId = 'printemps' | 'ete' | 'automne' | 'hiver';

export type AlbumSeason = {
  id: AlbumSeasonId;
  name: string;
  /** Cycles floraux (fleurs tirées) pour débloquer cette saison. */
  minBlooms: number;
  blurb: string;
  potFill: string;
  potStroke: string;
  potRim: string;
  soil: string;
  /** Teinte de fond du cadre plante. */
  frameTint: string;
};

export const ALBUM_SEASONS: AlbumSeason[] = [
  {
    id: 'printemps',
    name: 'Printemps',
    minBlooms: 0,
    blurb: 'Premières pousses — le pot encore clair.',
    potFill: '#C4B5A8',
    potStroke: '#A89888',
    potRim: '#D4C4B4',
    soil: '#8B7355',
    frameTint: '#E8F0E4',
  },
  {
    id: 'ete',
    name: 'Été',
    minBlooms: 3,
    blurb: 'Après quelques floraisons, le pot se réchauffe.',
    potFill: '#C9A88A',
    potStroke: '#A67C52',
    potRim: '#E0C4A0',
    soil: '#6B5340',
    frameTint: '#F5EDE0',
  },
  {
    id: 'automne',
    name: 'Automne',
    minBlooms: 6,
    blurb: 'Collection qui mûrit — tons terre cuite.',
    potFill: '#B07860',
    potStroke: '#8A5540',
    potRim: '#C99078',
    soil: '#5C4030',
    frameTint: '#F0E4D8',
  },
  {
    id: 'hiver',
    name: 'Hiver',
    minBlooms: 10,
    blurb: 'Beaucoup de cycles — pot plus sombre, présence posée.',
    potFill: '#8A9098',
    potStroke: '#5C646E',
    potRim: '#A8B0B8',
    soil: '#3A4048',
    frameTint: '#E4E8EC',
  },
];

export function resolveAlbumSeason(bloomCount: number): AlbumSeason {
  let current = ALBUM_SEASONS[0]!;
  for (const s of ALBUM_SEASONS) {
    if (bloomCount >= s.minBlooms) current = s;
  }
  return current;
}

export function nextAlbumSeason(bloomCount: number): AlbumSeason | null {
  const current = resolveAlbumSeason(bloomCount);
  const idx = ALBUM_SEASONS.findIndex((s) => s.id === current.id);
  return ALBUM_SEASONS[idx + 1] ?? null;
}

/**
 * Fleur signature : l’espèce la plus vue ; en cas d’égalité, la plus rare.
 */
export function pickSignatureSpecies(
  seenSpecies: FlowerSpeciesId[],
  byCycleSpecies: FlowerSpeciesId[],
): { id: FlowerSpeciesId; variante: FlowerVariante; name: string } | null {
  const counts = new Map<FlowerSpeciesId, number>();
  const source = byCycleSpecies.length > 0 ? byCycleSpecies : seenSpecies;
  for (const id of source) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  const rarityRank: Record<FlowerVariante, number> = {
    commune: 0,
    rare: 1,
    tres_rare: 2,
  };

  let bestId: FlowerSpeciesId | null = null;
  let bestCount = -1;
  let bestRarity = -1;

  for (const [id, count] of counts) {
    const species = FLOWER_SPECIES_BY_ID[id];
    if (!species) continue;
    const rank = rarityRank[species.rarity];
    if (
      count > bestCount ||
      (count === bestCount && rank > bestRarity)
    ) {
      bestId = id;
      bestCount = count;
      bestRarity = rank;
    }
  }

  if (!bestId) return null;
  const species = getSpecies(bestId);
  return { id: species.id, variante: species.rarity, name: species.name };
}
