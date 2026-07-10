import type { SymptomInsight } from './cycleInsights';
import type { SymptomKey } from '../types/cycle';

const SYMPTOM_ARTICLE: Partial<Record<SymptomKey, string>> = {
  'physical:crampes': 'crampes',
  'physical:migraine': 'migraine',
  'physical:seins_sensibles': 'seins',
  'physical:ballonnements': 'ballonnements',
  'physical:troubles_digestifs': 'transit',
  'skin:nickel': 'peau',
  'skin:ok': 'peau',
  'skin:acne': 'peau',
  'skin:grasse': 'peau',
  'skin:seche': 'peau',
  'discharge:marrons': 'glaire',
  'sleep:insomnie': 'insomnie',
  'sleep:endormissement_difficile': 'insomnie',
  'sleep:reveils_frequents': 'insomnie',
  'craving:sucre': 'cravings',
  'craving:chocolat': 'cravings',
  'craving:appetit_augmente': 'cravings',
  'craving:gras': 'cravings',
};

export function getArticleIdForInsight(insight: SymptomInsight): string | null {
  if (insight.kind === 'symptom' && insight.symptomKey) {
    return SYMPTOM_ARTICLE[insight.symptomKey] ?? null;
  }
  return null;
}
