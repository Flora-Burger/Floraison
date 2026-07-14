import type { CyclePhaseId, InsightPhaseId, SymptomKey } from '../types/cycle';

/**
 * Symptômes plausibles par phase — un insight n'apparaît que si le symptôme
 * a du sens hormonal/physiologique dans cette fenêtre (évite les coïncidences).
 */
const RELEVANT: Record<InsightPhaseId, ReadonlySet<SymptomKey>> = {
  menstruelle: new Set<SymptomKey>([
    'physical:crampes',
    'physical:migraine',
    'physical:douleurs_dos',
    'physical:ballonnements',
    'physical:nausees',
    'physical:fatigue',
    'physical:troubles_digestifs',
    'physical:vertiges',
    'discharge:marrons',
    'mood:irritable',
    'mood:sensible',
    'mood:triste',
    'mood:stressee',
    'sleep:besoin_plus_sommeil',
    'sleep:endormissement_difficile',
    'sleep:reveils_frequents',
  ]),
  folliculaire: new Set<SymptomKey>([
    'skin:nickel',
    'skin:ok',
    'mood:energique',
    'mood:heureuse',
    'mood:calme',
    'sleep:bonne_nuit',
    'sexual:libido_elevee',
  ]),
  ovulatoire: new Set<SymptomKey>([
    'discharge:blanches',
    'physical:crampes',
    'mood:energique',
    'mood:heureuse',
    'mood:calme',
    'sexual:libido_elevee',
    'sexual:rapport_protege',
    'sexual:rapport_non_protege',
    'sexual:masturbation',
  ]),
  luteale: new Set<SymptomKey>([
    'physical:seins_sensibles',
    'physical:ballonnements',
    'physical:fatigue',
    'physical:migraine',
    'physical:troubles_digestifs',
    'physical:douleurs_dos',
    'physical:nausees',
    'skin:acne',
    'skin:grasse',
    'skin:seche',
    'mood:irritable',
    'mood:anxieuse',
    'mood:triste',
    'mood:stressee',
    'mood:sensible',
    'sleep:insomnie',
    'sleep:endormissement_difficile',
    'sleep:reveils_frequents',
    'sleep:besoin_plus_sommeil',
    'craving:sucre',
    'craving:sale',
    'craving:gras',
    'craving:chocolat',
    'craving:appetit_augmente',
    'craving:pas_appetit',
    'sexual:libido_basse',
  ]),
  avant_regles: new Set<SymptomKey>([
    'physical:seins_sensibles',
    'physical:ballonnements',
    'physical:fatigue',
    'physical:migraine',
    'physical:crampes',
    'physical:troubles_digestifs',
    'physical:douleurs_dos',
    'skin:acne',
    'skin:grasse',
    'mood:irritable',
    'mood:anxieuse',
    'mood:triste',
    'mood:stressee',
    'mood:sensible',
    'sleep:insomnie',
    'sleep:endormissement_difficile',
    'sleep:reveils_frequents',
    'sleep:besoin_plus_sommeil',
    'craving:sucre',
    'craving:sale',
    'craving:gras',
    'craving:chocolat',
    'craving:appetit_augmente',
    'sexual:libido_basse',
  ]),
};

export function isSymptomRelevantForPhase(
  symptomKey: SymptomKey,
  phase: InsightPhaseId,
): boolean {
  return RELEVANT[phase].has(symptomKey);
}

/** Phases « calmes » pour comparer le contraste de la fenêtre avant-règles. */
export const CONTRAST_PHASES_FOR_PREMENSTRUAL: CyclePhaseId[] = [
  'folliculaire',
  'ovulatoire',
];
