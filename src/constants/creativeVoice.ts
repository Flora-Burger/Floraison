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

function hashKey(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickDawnGreeting(phase: CyclePhaseId, dateKey: string): string {
  const pool = DAWN_GREETINGS[phase];
  return pool[hashKey(`${dateKey}:${phase}:dawn`) % pool.length]!;
}
