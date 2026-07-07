import type { CyclePhaseId } from '../types/cycle';
import { FERTILITY, LAVENDER, PERIOD, SAGE } from './theme';

export type CyclePhaseContent = {
  id: CyclePhaseId;
  order: number;
  emoji: string;
  title: string;
  shortTitle: string;
  hormones: string;
  bodySummary: string;
  commonSymptoms: string[];
  body: string;
  color: string;
};

export const CYCLE_PHASES: CyclePhaseContent[] = [
  {
    id: 'menstruelle',
    order: 1,
    emoji: '🩸',
    title: 'Les Règles',
    shortTitle: 'Phase menstruelle',
    hormones: 'Œstrogène et progestérone au plus bas.',
    bodySummary:
      "L'utérus se contracte pour éliminer l'endomètre, ce qui crée le flux sanguin. L'énergie globale est souvent basse — c'est le moment de te reposer.",
    commonSymptoms: ['Crampes', 'Fatigue', 'Migraines', 'Ballonnements'],
    body: "Les hormones sont au plus bas. L'utérus se contracte pour éliminer l'endomètre, ce qui crée le flux sanguin. L'énergie globale est faible : accorde-toi du repos et hydrate-toi bien.",
    color: PERIOD,
  },
  {
    id: 'folliculaire',
    order: 2,
    emoji: '🌱',
    title: 'La Phase Folliculaire',
    shortTitle: 'Phase folliculaire',
    hormones: "L'œstrogène augmente progressivement.",
    bodySummary:
      "Un ovule se prépare dans l'ovaire. L'énergie remonte, la clarté mentale et le sommeil profond reviennent souvent à ce stade.",
    commonSymptoms: ['Énergie en hausse', 'Humeur stable', 'Peau plus nette'],
    body: "Le taux d'œstrogènes grimpe. Un ovule se prépare. Haute énergie, clarté mentale et sommeil profond de qualité — profite-en pour tes projets !",
    color: SAGE,
  },
  {
    id: 'ovulatoire',
    order: 3,
    emoji: '🥚',
    title: "L'Ovulation",
    shortTitle: 'Phase ovulatoire',
    hormones: "Pic d'œstrogène et de testostérone.",
    bodySummary:
      "L'ovaire libère l'ovule. C'est le pic de fertilité et souvent le moment où la libido est biologiquement au sommet.",
    commonSymptoms: ['Libido élevée', 'Douleurs légères au ventre', 'Pertes type blanc d\'œuf'],
    body: "L'ovaire libère l'ovule. Les taux d'œstrogènes et de testostérone sont au maximum. C'est le pic de fertilité et le moment où la libido est biologiquement au sommet.",
    color: FERTILITY,
  },
  {
    id: 'luteale',
    order: 4,
    emoji: '🍂',
    title: 'La Phase Lutéale',
    shortTitle: 'Phase lutéale',
    hormones: 'La progestérone domine, puis chute avant les règles.',
    bodySummary:
      'La progestérone stimule le sébum (acné fréquente en fin de phase). Sans grossesse, les hormones chutent, ce qui peut déclencher le SPM.',
    commonSymptoms: ['SPM', 'Fatigue', 'Irritabilité', 'Seins sensibles', 'Acné'],
    body: 'La progestérone prend le contrôle et stimule le sébum (acné fréquente en fin de phase). Si pas de grossesse, les hormones chutent brutalement, déclenchant le Syndrome Prémenstruel (SPM).',
    color: LAVENDER,
  },
];

export const TOPIC_ARTICLES = [
  {
    id: 'flux',
    title: 'Le Flux Sanguin',
    body: "Élimination de la paroi utérine. Plus fort les 2 premiers jours. S'il dure plus de 5 jours intenses, consultez pour vérifier le fer.",
  },
  {
    id: 'crampes',
    title: 'Les Crampes',
    body: "Provoquées par les prostaglandines qui font contracter l'utérus. Une gêne est courante, mais une douleur invalidante n'est PAS normale (piste de l'endométriose).",
  },
  {
    id: 'migraine',
    title: 'La Migraine Hormonale',
    body: "Déclenchée par la chute brutale de l'œstrogène juste avant les règles, ce qui contracte les vaisseaux sanguins crâniens.",
  },
  {
    id: 'seins',
    title: 'Les Seins Douloureux',
    body: "La progestérone fait gonfler les canaux mammaires en fin de cycle, créant des tensions qui s'estompent dès l'arrivée des règles.",
  },
  {
    id: 'ballonnements',
    title: 'Les Ballonnements',
    body: 'La progestérone relâche les muscles intestinaux (constipation avant les règles), tandis que les prostaglandines accélèrent le transit pendant les règles.',
  },
  {
    id: 'glaire',
    title: 'La Glaire Cervicale (Pertes)',
    body: "Fluide du col utérin. Sèche après les règles, crémeuse à l'approche de la fertilité, et semblable à du « blanc d'œuf » étirable au moment exact de l'ovulation (fertilité maximale).",
  },
];

const PHASE_LABELS: Record<CyclePhaseId, string> = {
  menstruelle: 'menstruelles',
  folliculaire: 'folliculaires',
  ovulatoire: 'ovulatoires',
  luteale: 'lutéales',
};

export function getPhaseLabelPlural(phaseId: CyclePhaseId): string {
  return `phases ${PHASE_LABELS[phaseId]}`;
}

export function getPhaseById(id: CyclePhaseId): CyclePhaseContent {
  const phase = CYCLE_PHASES.find((p) => p.id === id);
  if (!phase) throw new Error(`Unknown phase: ${id}`);
  return phase;
}

export function formatPhaseHero(phase: CyclePhaseContent): {
  headline: string;
  subtitle: string;
  symptomsLine: string;
} {
  return {
    headline: `Tu es actuellement en ${phase.shortTitle.toLowerCase()}`,
    subtitle: `${phase.hormones} ${phase.bodySummary}`,
    symptomsLine: `Symptômes fréquents : ${phase.commonSymptoms.join(', ')}`,
  };
}
