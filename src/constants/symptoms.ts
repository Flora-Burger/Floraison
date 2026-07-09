import { PERIOD_FLOW, TRACK_COLORS } from './theme';
import type {
  Discharge,
  Flow,
  FoodCraving,
  MoodTag,
  PhysicalSymptom,
  SexualActivity,
  Skin,
  SleepQuality,
  SymptomKey,
} from '../types/cycle';

export const FLOW_OPTIONS: { id: Flow; label: string; tint: string }[] = [
  { id: 'leger', label: 'Léger', tint: PERIOD_FLOW.leger },
  { id: 'moyen', label: 'Moyen', tint: PERIOD_FLOW.moyen },
  { id: 'fort', label: 'Fort', tint: PERIOD_FLOW.fort },
  { id: 'tres_abondant', label: 'Très abondant', tint: PERIOD_FLOW.tres_abondant },
];

export const DISCHARGE_OPTIONS: { id: Discharge; label: string }[] = [
  { id: 'blanches', label: 'Blanches' },
  { id: 'marrons', label: 'Marrons' },
];

export const PHYSICAL_OPTIONS: { id: PhysicalSymptom; label: string }[] = [
  { id: 'crampes', label: 'Crampes / douleurs abdominales' },
  { id: 'migraine', label: 'Maux de tête / migraines' },
  { id: 'douleurs_dos', label: 'Douleurs bas du dos' },
  { id: 'seins_sensibles', label: 'Seins sensibles / gonflés' },
  { id: 'ballonnements', label: 'Ballonnements' },
  { id: 'nausees', label: 'Nausées' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'troubles_digestifs', label: 'Troubles digestifs' },
  { id: 'bouffees_chaleur', label: 'Bouffées de chaleur' },
  { id: 'vertiges', label: 'Vertiges' },
];

export const SKIN_OPTIONS: { id: Skin; label: string }[] = [
  { id: 'nickel', label: 'Nickel' },
  { id: 'ok', label: 'Ok' },
  { id: 'acne', label: 'Acné' },
  { id: 'grasse', label: 'Grasse' },
  { id: 'seche', label: 'Sèche' },
];

export const MOOD_OPTIONS: { id: MoodTag; label: string }[] = [
  { id: 'heureuse', label: 'Heureuse' },
  { id: 'irritable', label: 'Irritable' },
  { id: 'anxieuse', label: 'Anxieuse' },
  { id: 'triste', label: 'Triste' },
  { id: 'stressee', label: 'Stressée' },
  { id: 'energique', label: 'Énergique' },
  { id: 'calme', label: 'Calme' },
  { id: 'sensible', label: 'Sensible émotionnellement' },
];

export const SLEEP_OPTIONS: { id: SleepQuality; label: string }[] = [
  { id: 'bonne_nuit', label: 'Bonne nuit' },
  { id: 'endormissement_difficile', label: "Difficultés à s'endormir" },
  { id: 'reveils_frequents', label: 'Réveils fréquents' },
  { id: 'insomnie', label: 'Insomnie' },
  { id: 'besoin_plus_sommeil', label: 'Besoin de plus de sommeil' },
];

export const CRAVING_OPTIONS: { id: FoodCraving; label: string }[] = [
  { id: 'sucre', label: 'Sucre' },
  { id: 'sale', label: 'Salé' },
  { id: 'gras', label: 'Gras' },
  { id: 'pas_appetit', label: "Pas d'appétit" },
  { id: 'appetit_augmente', label: 'Appétit augmenté' },
  { id: 'chocolat', label: 'Envie de chocolat' },
];

export const SEXUAL_OPTIONS: { id: SexualActivity; label: string }[] = [
  { id: 'libido_elevee', label: 'Libido élevée' },
  { id: 'libido_basse', label: 'Libido basse' },
  { id: 'rapport_protege', label: 'Rapport protégé' },
  { id: 'rapport_non_protege', label: 'Rapport non protégé' },
  { id: 'masturbation', label: 'Masturbation' },
];

export const TRACK_CATEGORY_TINTS = {
  discharge: TRACK_COLORS.discharge,
  physical: TRACK_COLORS.physical,
  skin: TRACK_COLORS.skin,
  mood: TRACK_COLORS.mood,
  sleep: TRACK_COLORS.sleep,
  cravings: TRACK_COLORS.cravings,
  sexual: TRACK_COLORS.sexual,
} as const;

const LABEL_MAP = new Map<SymptomKey, string>();

function registerLabels(prefix: string, options: { id: string; label: string }[]) {
  for (const opt of options) {
    LABEL_MAP.set(`${prefix}:${opt.id}` as SymptomKey, opt.label);
  }
}

registerLabels('physical', PHYSICAL_OPTIONS);
registerLabels('mood', MOOD_OPTIONS);
registerLabels('sleep', SLEEP_OPTIONS);
registerLabels('craving', CRAVING_OPTIONS);
registerLabels('sexual', SEXUAL_OPTIONS);
registerLabels('skin', SKIN_OPTIONS);
registerLabels('discharge', DISCHARGE_OPTIONS);

export function getSymptomLabel(key: SymptomKey): string {
  return LABEL_MAP.get(key) ?? key;
}
