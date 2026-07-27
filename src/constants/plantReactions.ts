export type ReactionCategory =
  | 'premierLogDuJour'
  | 'logApresAbsence'
  | 'streakLongue'
  | 'symptomeIntense';

export type PlantReaction = {
  id: string;
  /** translateY / scale léger, durée 0.5–1s */
  motion: { dy: number; scale: number; durationMs: number };
  /** Plus doux pour symptomeIntense */
  soft?: boolean;
};

export const plantReactions: Record<ReactionCategory, PlantReaction[]> = {
  premierLogDuJour: [
    {
      id: 'bonjour_leger',
      motion: { dy: -6, scale: 1.04, durationMs: 700 },
    },
    {
      id: 'bonjour_souple',
      motion: { dy: -8, scale: 1.05, durationMs: 800 },
    },
    {
      id: 'bonjour_petit_rebond',
      motion: { dy: -5, scale: 1.06, durationMs: 650 },
    },
  ],
  logApresAbsence: [
    {
      id: 'retour_doux',
      motion: { dy: -4, scale: 1.03, durationMs: 900 },
    },
    {
      id: 'retour_accueil',
      motion: { dy: -7, scale: 1.04, durationMs: 850 },
    },
    {
      id: 'retour_calme',
      motion: { dy: -3, scale: 1.035, durationMs: 950 },
    },
  ],
  streakLongue: [
    {
      id: 'streak_fierte',
      motion: { dy: -9, scale: 1.07, durationMs: 750 },
    },
    {
      id: 'streak_danse',
      motion: { dy: -10, scale: 1.08, durationMs: 700 },
    },
    {
      id: 'streak_eclat',
      motion: { dy: -6, scale: 1.06, durationMs: 800 },
    },
  ],
  symptomeIntense: [
    {
      id: 'soutien_doux',
      soft: true,
      motion: { dy: -2, scale: 1.015, durationMs: 1000 },
    },
    {
      id: 'soutien_presence',
      soft: true,
      motion: { dy: -3, scale: 1.02, durationMs: 950 },
    },
    {
      id: 'soutien_respiration',
      soft: true,
      motion: { dy: -1.5, scale: 1.018, durationMs: 1100 },
    },
  ],
};

/** Tire au hasard en évitant les 1–2 dernières IDs de la catégorie. */
export function pickReaction(
  category: ReactionCategory,
  recentIds: string[] = [],
): PlantReaction {
  const pool = plantReactions[category];
  const avoid = new Set(recentIds.slice(-2));
  const candidates = pool.filter((r) => !avoid.has(r.id));
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)]!;
}
