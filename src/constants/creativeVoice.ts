import type { CyclePhaseId } from '../types/cycle';

const DAWN_GREETINGS: Record<CyclePhaseId, string[]> = {
  menstruelle: [
    'L’aube est basse. On allume juste une petite lampe.',
    'Bonjour, graine. Aujourd’hui on ne force rien.',
    'Le jour commence sans exigence — juste une présence.',
  ],
  folliculaire: [
    'L’air sent la pousse. Bonjour, tige qui se redresse.',
    'Une feuille s’étire vers la lumière. Toi aussi, si tu veux.',
    'L’aube est claire. On peut semer un geste minuscule.',
  ],
  ovulatoire: [
    'Plein soleil déjà dans le pot. Bonjour, floraison.',
    'Le jour s’ouvre grand — comme une corolle.',
    'Aube haute. Une fleur n’a pas besoin d’explication.',
  ],
  luteale: [
    'L’aube est ambrée. On rentre doucement les outils.',
    'Bonjour, fruits encore verts. On mûrit sans se presser.',
    'Le jour commence en demi-teinte. C’est une saison aussi.',
  ],
};

const PLANT_REPLIES: Record<CyclePhaseId, string[]> = {
  menstruelle: [
    'Je t’ai lue. Je me fais petite pour laisser de la place.',
    'Merci. Je garde ta phrase dans mon silence.',
    'Je suis là, racine contre racine. Pas besoin d’autre réponse.',
  ],
  folliculaire: [
    'J’ai senti ta lettre monter dans ma tige.',
    'Je pousse un peu plus fort — juste pour toi.',
    'Ta phrase est une goutte. J’en fais une feuille.',
  ],
  ovulatoire: [
    'Je fleuris en réponse. C’est tout ce que je sais faire.',
    'Ta lettre ouvre ma corolle. Je te regarde.',
    'J’ai reçu. Aujourd’hui je suis toute couleur.',
  ],
  luteale: [
    'Je plie ta lettre dans un pétale qui se referme.',
    'Merci. Je mûris avec ce que tu m’as confié.',
    'Je te réponds en ombre douce. C’est ma façon.',
  ],
};

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickDawnGreeting(phase: CyclePhaseId, dateKey: string): string {
  const pool = DAWN_GREETINGS[phase];
  return pool[hashKey(`${dateKey}:${phase}:dawn`) % pool.length]!;
}

export function pickPlantReply(
  phase: CyclePhaseId,
  userText: string,
  dateKey: string,
): string {
  const pool = PLANT_REPLIES[phase];
  return pool[hashKey(`${dateKey}:${phase}:${userText.slice(0, 24)}`) % pool.length]!;
}

/** Noms botaniques poétiques (pas cliniques) pour la boussole. */
export const BLOOM_COMPASS_LABELS: Record<CyclePhaseId, { short: string; full: string }> = {
  menstruelle: { short: 'Graine', full: 'Temps de la graine' },
  folliculaire: { short: 'Pousse', full: 'Temps de la pousse' },
  ovulatoire: { short: 'Fleur', full: 'Temps de la fleur' },
  luteale: { short: 'Fruit', full: 'Temps du fruit' },
};
