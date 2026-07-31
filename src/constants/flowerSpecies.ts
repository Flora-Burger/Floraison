import type { FlowerVariante } from '../lib/plantRarity';

/** Espèces débloquables à l’ovulation — collection, pas des vers. */
export type FlowerSpeciesId =
  | 'capucine'
  | 'rose_jardin'
  | 'bleuet'
  | 'pavot'
  | 'lys'
  | 'anemone'
  | 'orchidee'
  | 'edelweiss';

export type FlowerSpecies = {
  id: FlowerSpeciesId;
  name: string;
  rarity: FlowerVariante;
  /** Une ligne claire, concrète. */
  blurb: string;
  petalColor: string;
  centerColor: string;
  /** Nombre de pétales (layout SVG). */
  petalLayout: 'cinq' | 'six' | 'huit';
  elongated?: boolean;
};

export const FLOWER_SPECIES: FlowerSpecies[] = [
  {
    id: 'capucine',
    name: 'Capucine',
    rarity: 'commune',
    blurb: 'Orange vif, courante — souvent la première floraison.',
    petalColor: '#E89B5C',
    centerColor: '#E8C547',
    petalLayout: 'cinq',
  },
  {
    id: 'rose_jardin',
    name: 'Rose de jardin',
    rarity: 'commune',
    blurb: 'Rose doux, classique. Celle qu’on reconnaît tout de suite.',
    petalColor: '#D4849A',
    centerColor: '#F0C4D0',
    petalLayout: 'cinq',
  },
  {
    id: 'bleuet',
    name: 'Bleuet',
    rarity: 'commune',
    blurb: 'Bleu franc, léger. Une fleur de champ, sans chichi.',
    petalColor: '#6B8FC4',
    centerColor: '#E8C547',
    petalLayout: 'cinq',
  },
  {
    id: 'pavot',
    name: 'Pavot',
    rarity: 'rare',
    blurb: 'Pétales fins, rouge-orangé. Plus rare, un peu théâtrale.',
    petalColor: '#C75B4A',
    centerColor: '#2A2A2A',
    petalLayout: 'six',
    elongated: true,
  },
  {
    id: 'lys',
    name: 'Lys',
    rarity: 'rare',
    blurb: 'Forme allongée, crème-rosé. Une présence plus posée.',
    petalColor: '#E8D4E0',
    centerColor: '#C9A0DC',
    petalLayout: 'six',
    elongated: true,
  },
  {
    id: 'anemone',
    name: 'Anémone',
    rarity: 'rare',
    blurb: 'Centre sombre, corolle ouverte. Discrète mais marquante.',
    petalColor: '#8B6BB0',
    centerColor: '#2A2A2A',
    petalLayout: 'six',
  },
  {
    id: 'orchidee',
    name: 'Orchidée',
    rarity: 'tres_rare',
    blurb: 'Beaucoup de pétales, violet profond. Très rare.',
    petalColor: '#9B6B9E',
    centerColor: '#E8C547',
    petalLayout: 'huit',
  },
  {
    id: 'edelweiss',
    name: 'Edelweiss',
    rarity: 'tres_rare',
    blurb: 'Blanc duveteux, centre doré. La plus rare de la collection.',
    petalColor: '#F5F0E8',
    centerColor: '#E8C547',
    petalLayout: 'huit',
  },
];

export const FLOWER_SPECIES_BY_ID: Record<FlowerSpeciesId, FlowerSpecies> =
  Object.fromEntries(FLOWER_SPECIES.map((s) => [s.id, s])) as Record<
    FlowerSpeciesId,
    FlowerSpecies
  >;

const BY_RARITY: Record<FlowerVariante, FlowerSpeciesId[]> = {
  commune: ['capucine', 'rose_jardin', 'bleuet'],
  rare: ['pavot', 'lys', 'anemone'],
  tres_rare: ['orchidee', 'edelweiss'],
};

/** Compat anciens tirages sans speciesId. */
export function speciesFromLegacyVariante(variante: FlowerVariante): FlowerSpeciesId {
  if (variante === 'tres_rare') return 'orchidee';
  if (variante === 'rare') return 'pavot';
  return 'capucine';
}

export function getSpecies(
  id: FlowerSpeciesId | undefined,
  fallbackVariante: FlowerVariante = 'commune',
): FlowerSpecies {
  if (id && FLOWER_SPECIES_BY_ID[id]) return FLOWER_SPECIES_BY_ID[id];
  return FLOWER_SPECIES_BY_ID[speciesFromLegacyVariante(fallbackVariante)];
}

/** Tirage pondéré : d’abord la rareté, puis une espèce de ce palier. */
export function rollFlowerSpecies(rng: () => number = Math.random): FlowerSpecies {
  const r = rng();
  let rarity: FlowerVariante = 'commune';
  if (r < 0.03) rarity = 'tres_rare';
  else if (r < 0.15) rarity = 'rare';

  const pool = BY_RARITY[rarity];
  const id = pool[Math.floor(rng() * pool.length)]!;
  return FLOWER_SPECIES_BY_ID[id];
}

export const RARITY_LABELS: Record<FlowerVariante, string> = {
  commune: 'Commune',
  rare: 'Rare',
  tres_rare: 'Très rare',
};

export function collectionProgress(seenIds: FlowerSpeciesId[]): {
  found: number;
  total: number;
  label: string;
} {
  const unique = new Set(seenIds);
  const found = unique.size;
  const total = FLOWER_SPECIES.length;
  return {
    found,
    total,
    label: `${found} / ${total} fleurs`,
  };
}
