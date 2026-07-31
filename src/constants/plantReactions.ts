export type ReactionCategory =
  | 'premierLogDuJour'
  | 'logApresAbsence'
  | 'streakLongue'
  | 'symptomeIntense';

export type PlantReaction = {
  id: string;
  /** Ligne courte sous la plante (tutoiement, pas mièvre). */
  message: string;
  /** translateY / scale léger, durée 0.5–1s */
  motion: { dy: number; scale: number; durationMs: number };
  /** Plus doux pour symptomeIntense */
  soft?: boolean;
};

export const plantReactions: Record<ReactionCategory, PlantReaction[]> = {
  premierLogDuJour: [
    {
      id: 'bonjour_leger',
      message: 'Coucou — content·e de te voir noter aujourd’hui.',
      motion: { dy: -6, scale: 1.04, durationMs: 700 },
    },
    {
      id: 'bonjour_souple',
      message: 'Premier log du jour : je pousse un peu plus droit.',
      motion: { dy: -8, scale: 1.05, durationMs: 800 },
    },
    {
      id: 'bonjour_petit_rebond',
      message: 'Noté. On avance ensemble, sans forcer.',
      motion: { dy: -5, scale: 1.06, durationMs: 650 },
    },
  ],
  logApresAbsence: [
    {
      id: 'retour_doux',
      message: 'Te revoilà — pas de jugement, juste content·e.',
      motion: { dy: -4, scale: 1.03, durationMs: 900 },
    },
    {
      id: 'retour_accueil',
      message: 'Bienvenue à nouveau. On reprend où tu en es.',
      motion: { dy: -7, scale: 1.04, durationMs: 850 },
    },
    {
      id: 'retour_calme',
      message: 'Pause ou pas, tu es là. Ça me suffit.',
      motion: { dy: -3, scale: 1.035, durationMs: 950 },
    },
  ],
  streakLongue: [
    {
      id: 'streak_fierte',
      message: 'Plusieurs jours d’affilée — belle constance.',
      motion: { dy: -9, scale: 1.07, durationMs: 750 },
    },
    {
      id: 'streak_danse',
      message: 'Ta régularité nourrit la plante. Merci.',
      motion: { dy: -10, scale: 1.08, durationMs: 700 },
    },
    {
      id: 'streak_eclat',
      message: 'Streak en cours : chaque note compte.',
      motion: { dy: -6, scale: 1.06, durationMs: 800 },
    },
  ],
  symptomeIntense: [
    {
      id: 'soutien_doux',
      soft: true,
      message: 'C’est intense aujourd’hui — je reste tout près.',
      motion: { dy: -2, scale: 1.015, durationMs: 1000 },
    },
    {
      id: 'soutien_presence',
      soft: true,
      message: 'Tu n’as rien à prouver. On ralentit ensemble.',
      motion: { dy: -3, scale: 1.02, durationMs: 950 },
    },
    {
      id: 'soutien_respiration',
      soft: true,
      message: 'Doucement. Ton corps parle, on l’écoute.',
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
