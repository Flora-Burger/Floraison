export type Flow = 'leger' | 'moyen' | 'fort' | 'tres_abondant';
export type Skin = 'nickel' | 'ok' | 'acne' | 'grasse' | 'seche';
export type Discharge = 'blanches' | 'marrons';

export type PhysicalSymptom =
  | 'crampes'
  | 'migraine'
  | 'douleurs_dos'
  | 'seins_sensibles'
  | 'ballonnements'
  | 'nausees'
  | 'fatigue'
  | 'troubles_digestifs'
  | 'bouffees_chaleur'
  | 'vertiges';

export type MoodTag =
  | 'heureuse'
  | 'irritable'
  | 'anxieuse'
  | 'triste'
  | 'stressee'
  | 'energique'
  | 'calme'
  | 'sensible';

export type SleepQuality =
  | 'bonne_nuit'
  | 'endormissement_difficile'
  | 'reveils_frequents'
  | 'insomnie'
  | 'besoin_plus_sommeil';

export type FoodCraving =
  | 'sucre'
  | 'sale'
  | 'gras'
  | 'pas_appetit'
  | 'appetit_augmente'
  | 'chocolat';

export type SexualActivity =
  | 'libido_elevee'
  | 'libido_basse'
  | 'rapport_protege'
  | 'rapport_non_protege'
  | 'masturbation';

export type DayEntry = {
  period?: boolean;
  flow?: Flow;
  discharge?: Discharge[];
  skin?: Skin[];
  physical?: PhysicalSymptom[];
  mood?: MoodTag[];
  sleep?: SleepQuality[];
  cravings?: FoodCraving[];
  sexual?: SexualActivity[];
  journal?: string;
  /** @deprecated migré vers physical[] */
  symptoms?: string[];
};

export type CycleData = Record<string, DayEntry>;

export type CyclePhaseId = 'menstruelle' | 'folliculaire' | 'ovulatoire' | 'luteale';

/** Fenêtre des 7 jours précédant les prochaines règles (insights uniquement). */
export type InsightPhaseId = CyclePhaseId | 'avant_regles';

export type SymptomKey =
  | `physical:${PhysicalSymptom}`
  | `mood:${MoodTag}`
  | `sleep:${SleepQuality}`
  | `craving:${FoodCraving}`
  | `sexual:${SexualActivity}`
  | `skin:${Skin}`
  | `discharge:${Discharge}`;
