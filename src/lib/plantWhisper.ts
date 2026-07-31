import type { CyclePhaseId } from '../types/cycle';

/** Murmures de la plante — révélés au tap, une phrase par jour. */
const WHISPERS: Record<CyclePhaseId, string[]> = {
  menstruelle: [
    'Je me fais toute petite avec toi.',
    'Pas besoin de grandir aujourd’hui.',
    'Je garde le silence à tes côtés.',
  ],
  folliculaire: [
    'Regarde : une feuille de plus, presque rien.',
    'On pousse sans se presser.',
    'J’aime quand tu reviens me voir.',
  ],
  ovulatoire: [
    'Aujourd’hui je fleuris pour deux.',
    'Un souffle, et la corolle s’ouvre.',
    'Je brille un peu — c’est permis.',
  ],
  luteale: [
    'Je rentre mes pétales, pas ma présence.',
    'On mûrit ensemble, même si c’est invisible.',
    'Je suis encore là quand le jour baisse.',
  ],
};

const HARD_DAY_WHISPERS = [
  'Jour lourd ? Je m’incline avec toi.',
  'Pose-toi. Je tiens le pot.',
  'Rien à prouver. Je reste.',
];

const STREAK_WHISPERS = [
  'Tu es revenue. Ça me fait du bien.',
  'Un fil doux entre nous, jour après jour.',
];

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type WhisperContext = {
  phase: CyclePhaseId;
  dateKey: string;
  hardDay?: boolean;
  streak?: number;
};

export function pickPlantWhisper(ctx: WhisperContext): string {
  if (ctx.hardDay) {
    return HARD_DAY_WHISPERS[hashKey(`${ctx.dateKey}:hard`) % HARD_DAY_WHISPERS.length]!;
  }
  if ((ctx.streak ?? 0) >= 5) {
    return STREAK_WHISPERS[hashKey(`${ctx.dateKey}:streak`) % STREAK_WHISPERS.length]!;
  }
  const pool = WHISPERS[ctx.phase];
  return pool[hashKey(`${ctx.dateKey}:${ctx.phase}:whisper`) % pool.length]!;
}
