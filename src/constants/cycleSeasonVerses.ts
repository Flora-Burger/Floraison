import type { CyclePhaseId } from '../types/cycle';

/** Vers courts — une saison intérieure, sans jargon médical. */
export const CYCLE_SEASON_VERSES: Record<CyclePhaseId, string[]> = {
  menstruelle: [
    'Petite nuit intérieure. On baisse la lumière.',
    'La terre se repose — toi aussi, si tu peux.',
    'Ce qui part fait de la place. Doucement.',
  ],
  folliculaire: [
    'Le jour s’allonge dans le corps. Une pousse invisible.',
    'Sème sans compter les fruits. L’élan suffit.',
    'L’air devient plus clair. Suis ce qui se redresse.',
  ],
  ovulatoire: [
    'Plein soleil sur la tige. Une fleur tient dans un souffle.',
    'Tout est ouvert un instant — même sans spectacle.',
    'La lumière est haute. Tu peux juste la traverser.',
  ],
  luteale: [
    'Le jardin se referme un peu. Garde ce qui mûrit.',
    'Ombre douce sur les feuilles. Ralentir n’est pas reculer.',
    'On rentre les outils. La récolte peut être intérieure.',
  ],
};

export const LATE_LUTEAL_VERSES = [
  'La saison s’étire. Pas d’horloge stricte ici.',
  'Encore un crépuscule. On attend sans forcer.',
];

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickCycleSeasonVerse(
  phase: CyclePhaseId,
  dateKey: string,
  options?: { lateLuteal?: boolean },
): string {
  const pool =
    options?.lateLuteal && phase === 'luteale'
      ? LATE_LUTEAL_VERSES
      : CYCLE_SEASON_VERSES[phase];
  return pool[hashKey(`${dateKey}:${phase}:verse`) % pool.length]!;
}
