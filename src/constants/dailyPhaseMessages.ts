import type { CyclePhaseId } from '../types/cycle';

export type DailyMessageTone = 'narratif' | 'scientifique';

export type PhaseDailyMessages = {
  narratif: string[];
  scientifique: string[];
};

export const DAILY_PHASE_MESSAGES: Record<CyclePhaseId, PhaseDailyMessages> = {
  menstruelle: {
    narratif: [
      "Aujourd'hui on ralentit — ton corps fait le ménage, c'est pas de la flemme.",
      'Je reste proche de toi. Pas besoin de performer, juste d’écouter.',
      'On pose les outils. Ce qui se vide laisse de la place — même si c’est inconfortable.',
      'Ton énergie peut être basse : c’est le cycle qui parle, pas ta valeur.',
    ],
    scientifique: [
      'Œstrogène et progestérone au plus bas : l’utérus évacue l’endomètre. Beaucoup ressentent moins d’énergie ces jours-là.',
      'Les contractions utérines aident à éliminer la muqueuse — d’où parfois crampes ou fatigue.',
      'La perte de sang est en moyenne modeste (~30–40 ml sur tout le flux), mais le corps dépense quand même de l’énergie.',
      'Le fer peut baisser pendant les règles : la fatigue ressentie a souvent une base physiologique réelle.',
    ],
  },
  folliculaire: {
    narratif: [
      'La tige se redresse. Accueille ce qui revient, sans te presser.',
      'On pousse doucement — chaque petit pas compte cette semaine.',
      'Tu peux sentir l’élan revenir : laisse-le monter à son rythme.',
      'C’est le moment de semer, pas d’exiger la récolte tout de suite.',
    ],
    scientifique: [
      'L’œstrogène monte : follicules en maturation et endomètre qui s’épaissit — c’est souvent là que l’énergie revient.',
      'La FSH stimule plusieurs follicules ; l’un deviendra dominant sous l’effet des œstrogènes.',
      'La hausse des œstrogènes influence sérotonine et dopamine — beaucoup notent plus de clarté ou de motivation.',
      'Le corps reconstruit la muqueuse utérine après les règles : phase de préparation avant l’ovulation.',
    ],
  },
  ovulatoire: {
    narratif: [
      'Pleine floraison aujourd’hui — profites-en, même cinq minutes.',
      'Tu es au sommet du cycle : accorde-toi ce qui te fait du bien.',
      'L’énergie peut être là — pas obligée d’être productive, juste présente.',
      'On fleurit. Ce pic ne dure pas longtemps, et c’est normal.',
    ],
    scientifique: [
      'Pic de LH : l’ovule est libéré. La fenêtre fertile est courte (ovule viable ~12–24 h).',
      'Œstrogène et testostérone culminent souvent autour de l’ovulation — libido et dynamisme peuvent monter.',
      'Les pertes peuvent devenir plus filantes (« blanc d’œuf ») : signe fréquent de fertilité élevée.',
      'L’ovulation peut s’accompagner d’une brève douleur d’un côté (Mittelschmerz) — pas toujours ressentie.',
    ],
  },
  luteale: {
    narratif: [
      'On rentre au calme. Pas besoin de forcer la machine.',
      'Les pétales tombent, les fruits mûrissent — transition, pas échec.',
      'Si tout te semble plus lourd, ton cycle y est peut-être pour quelque chose.',
      'Je reste là. Tu n’as rien à prouver en fin de cycle.',
    ],
    scientifique: [
      'Progestérone en tête : le corps prépare la suite. Humeur ou sommeil plus sensible — c’est hormonal, pas un défaut personnel.',
      'Après l’ovulation, le corps de Jaune sécrète de la progestérone pour épaissir l’endomètre.',
      'Si pas de grossesse, hormones en baisse en fin de lutéale — symptômes prémenstruels possibles.',
      'La rétention d’eau ou les seins sensibles en fin de cycle sont des effets fréquents de la progestérone.',
    ],
  },
};

export function buildDailyMessageId(
  phase: CyclePhaseId,
  tone: DailyMessageTone,
  index: number,
): string {
  return `${phase}:${tone}:${index}`;
}

export function listDailyMessageIds(
  phase: CyclePhaseId,
  tone: DailyMessageTone,
): string[] {
  return DAILY_PHASE_MESSAGES[phase][tone].map((_, i) =>
    buildDailyMessageId(phase, tone, i),
  );
}
