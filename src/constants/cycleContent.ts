import type { CyclePhaseId } from '../types/cycle';
import { FERTILITY, LAVENDER, PERIOD, SAGE } from './theme';

export type BodyArticleContent = {
  id: string;
  emoji: string;
  title: string;
  color: string;
  mechanism: string;
  funFact: string;
  studyLabel: string;
  studyUrl: string;
};

export type CyclePhaseContent = BodyArticleContent & {
  id: CyclePhaseId;
  order: number;
  shortTitle: string;
  hormones: string;
  bodySummary: string;
  commonSymptoms: string[];
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
      "L'utérus se contracte pour éliminer l'endomètre. L'énergie globale est souvent basse — c'est le moment de te reposer.",
    commonSymptoms: ['Crampes', 'Fatigue', 'Migraines', 'Ballonnements'],
    color: PERIOD,
    mechanism:
      "Chaque mois, si aucun ovule n'est fécondé, la chute des hormones (œstrogènes et progestérone) déclenche le détachement de l'endomètre (la muqueuse utérine). C'est ce tissu, mêlé à du sang, qui s'écoule. La fatigue ressentie est réelle : le corps consomme de l'énergie pour contracter l'utérus et nettoyer la place, et la perte de fer peut accentuer ce coup de mou.",
    funFact:
      "On a souvent l'impression de vider son sang, mais en réalité, on ne perd en moyenne que 30 à 40 ml (environ 2 à 3 cuillères à soupe) sur toute la durée des règles. Si vous remplissez plus de 80 ml, le flux est considéré comme abondant.",
    studyLabel:
      "Une étude publiée sur les règles abondantes montre leur impact direct sur la fatigue, l'anémie ferriprive et la qualité de vie des femmes en âge de procréer.",
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6500811/',
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
    color: SAGE,
    mechanism:
      "Sous l'impulsion de l'hormone FSH (hormone folliculo-stimulante), plusieurs follicules contenant chacun un ovule commencent à mûrir dans vos ovaires. En parallèle, le taux d'œstrogènes grimpe en flèche. Cette hormone épaissit à nouveau l'endomètre et stimule la production de sérotonine et de dopamine dans le cerveau, boostant l'énergie, la motivation, la sociabilité et même la résistance à la douleur.",
    funFact:
      "C'est votre phase « super-héroïne » ! C'est le moment idéal pour entamer un projet complexe ou planifier des entraînements sportifs intenses, car votre corps utilise mieux les glucides comme source d'énergie immédiate.",
    studyLabel:
      "Une revue scientifique sur les neurotransmetteurs et le cycle menstruel confirme que la hausse des œstrogènes en phase folliculaire augmente la synthèse de sérotonine, améliorant l'humeur, la cognition et la tolérance à la douleur, tout en influençant la dopamine liée à la motivation.",
    studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/39562466/',
  },
  {
    id: 'ovulatoire',
    order: 3,
    emoji: '🥚',
    title: "L'Ovulation",
    shortTitle: 'Phase ovulatoire',
    hormones: "Pic d'œstrogène et de testostérone.",
    bodySummary:
      "L'ovaire libère l'ovule. C'est le pic de fertilité et souvent le moment où la libido est au sommet.",
    commonSymptoms: ['Libido élevée', 'Douleurs légères au ventre', "Pertes type blanc d'œuf"],
    color: FERTILITY,
    mechanism:
      "Provoqué par un pic soudain d'hormone LH (hormone lutéinisante), le follicule dominant éclate et libère l'ovule dans la trompe de Fallope. L'ovule n'a une durée de vie que de 12 à 24 heures. Le pic d'œstrogènes et de testostérone à ce moment-là augmente généralement la libido, le dynamisme et la confiance en soi.",
    funFact:
      "Environ une femme sur cinq ressent le Mittelschmerz (mot allemand pour « douleur du milieu »), une légère aiguille ou crampe d'un seul côté du bas-ventre qui indique précisément quel ovaire est en train de travailler ce mois-ci.",
    studyLabel:
      'L\'étude de référence de Wilcox, Dunson et Baird, « The timing of the fertile window in the menstrual cycle », parue dans Human Reproduction, confirme les fenêtres de viabilité de l\'ovule (12 à 24h) et la variabilité du jour d\'ovulation d\'une femme à l\'autre.',
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC27529/',
  },
  {
    id: 'luteale',
    order: 4,
    emoji: '🍂',
    title: 'La Phase Lutéale',
    shortTitle: 'Phase lutéale',
    hormones: 'La progestérone domine, puis chute avant les règles.',
    bodySummary:
      'La progestérone stimule le sébum. Sans grossesse, les hormones chutent, ce qui peut déclencher le SPM.',
    commonSymptoms: ['SPM', 'Fatigue', 'Irritabilité', 'Seins sensibles', 'Acné'],
    color: LAVENDER,
    mechanism:
      "Le follicule vide se transforme en « corps jaune » et sécrète massivement de la progestérone. Cette hormone prépare l'utérus à une éventuelle nidation. Si l'ovulation n'a pas mené à une grossesse, le corps jaune se désintègre, provoquant une chute verticale de la progestérone et des œstrogènes en fin de cycle. Ce sevrage hormonal brutal est le grand responsable du Syndrome Prémenstruel (SPM).",
    funFact:
      "Votre métabolisme de base s'accélère ! Votre corps brûle naturellement entre 100 et 300 calories de plus par jour durant cette phase, ce qui explique ces fringales de glucides et de réconfort.",
    studyLabel:
      'Une revue sur les mécanismes neuro-inflammatoires du SPM/TDPM décrypte comment la chute de la progestérone en fin de phase lutéale interagit avec les récepteurs de la sérotonine dans le cerveau, provoquant l\'irritabilité et l\'anxiété prémenstruelle.',
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11985436/',
  },
];

export const TOPIC_ARTICLES: BodyArticleContent[] = [
  {
    id: 'flux',
    emoji: '🩸',
    title: 'Le Flux Sanguin',
    color: PERIOD,
    mechanism:
      "La couleur du sang reflète son niveau d'oxydation. Un sang rouge vif signifie qu'il s'écoule rapidement. Un sang marron, voire noir, est simplement du sang plus ancien qui a mis du temps à descendre et a réagi avec l'oxygène de l'air. La présence de petits caillots est normale (ce sont des morceaux de muqueuse), mais s'ils sont plus gros qu'une pièce de monnaie, cela mérite une vérification.",
    funFact:
      "Le saviez-vous ? Ce n'est qu'en 2011 qu'une publicité pour protections hygiéniques a osé montrer un liquide rouge à la télévision pour la première fois (une marque australienne). Avant cela, le fameux liquide bleu ultra-chimique était la norme absolue sur tous nos écrans.",
    studyLabel:
      'L\'ACOG (American College of Obstetricians and Gynecologists), dans son Committee Opinion No. 651, considère le cycle menstruel comme un « signe vital » de la santé générale, au même titre que la tension artérielle ou la fréquence cardiaque.',
    studyUrl:
      'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign',
  },
  {
    id: 'crampes',
    emoji: '⚡',
    title: 'Les Crampes',
    color: PERIOD,
    mechanism:
      "Pour expulser la muqueuse utérine devenue inutile, le corps produit des prostaglandines, des composés qui forcent l'utérus à se contracter. Si ces contractions sont trop fortes, elles coupent temporairement l'apport de sang et d'oxygène aux muscles de l'utérus, ce qui génère la douleur. La chaleur (bouillotte) dilate les vaisseaux et calme la douleur aussi efficacement que certains analgésiques.",
    funFact:
      "Le saviez-vous ? La toute première bouillotte moderne en caoutchouc a été inventée et brevetée en 1903 par un ingénieur croate nommé Eduard Penkala (qui a aussi inventé le premier porte-mine mécanique). Avant lui, on utilisait des briques chauffées ou des récipients en métal brûlants enveloppés dans du tissu.",
    studyLabel:
      "Une méta-analyse récente (57 essais randomisés, plus de 5 300 participantes) confirme que la thérapie par la chaleur réduit significativement l'intensité de la dysménorrhée primaire, avec une efficacité comparable aux anti-inflammatoires et un meilleur profil de sécurité.",
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12876241/',
  },
  {
    id: 'transit',
    emoji: '🚽',
    title: 'Le Transit & les « Cacas de Règles »',
    color: PERIOD,
    mechanism:
      "Beaucoup de femmes souffrent de diarrhée ou de transit très accéléré les premiers jours des règles. C'est à cause des prostaglandines (les mêmes molécules qui font contracter l'utérus). Elles se diffusent dans les tissus voisins et viennent stimuler et contracter les muscles des intestins, accélérant brutalement le transit.",
    funFact:
      "Les « cacas de règles », c'est une réalité scientifique ! Votre utérus et vos intestins partagent le même espace et vos intestins subissent les vibrations des contractions de l'utérus. Ils finissent par danser la même chorégraphie.",
    studyLabel:
      "La même étude sur les symptômes gastro-intestinaux chez des femmes en bonne santé a montré que 28% d'entre elles rapportent une diarrhée pendant leurs règles (contre 24% avant), un phénomène attribué à la diffusion systémique des prostaglandines.",
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3901893/',
  },
  {
    id: 'peau',
    emoji: '✨',
    title: 'La Peau qui Rayonne',
    color: SAGE,
    mechanism:
      "La montée des œstrogènes en phase folliculaire ne profite pas qu'au cerveau : elle stimule aussi la production de collagène, d'acide hyaluronique et renforce la fonction barrière de la peau. Résultat, la peau retient mieux l'eau, paraît plus ferme et plus lumineuse. C'est aussi la période où le renouvellement cellulaire est le plus efficace.",
    funFact:
      "C'est le fameux « ovulation glow » dont tout le monde parle sur les réseaux — et ce n'est pas qu'un filtre Instagram, c'est bien réel ! C'est aussi le meilleur moment du cycle pour tester un nouvel actif un peu costaud (rétinol, exfoliant) : la peau est plus résistante et moins réactive qu'en fin de cycle.",
    studyLabel:
      "Une revue de synthèse (scoping review) sur les changements physiologiques de la peau au cours du cycle menstruel confirme le lien entre la hausse des œstrogènes en phase folliculaire et l'amélioration de l'élasticité, de l'hydratation et de la fonction barrière cutanée.",
    studyUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11703644/',
  },
  {
    id: 'glaire',
    emoji: '💧',
    title: 'La Glaire Cervicale (Pertes)',
    color: FERTILITY,
    mechanism:
      "Fluide du col utérin qui change selon les hormones. Sèche après les règles, crémeuse à l'approche de la fertilité, et semblable à du « blanc d'œuf » étirable au moment exact de l'ovulation (fertilité maximale).",
    funFact:
      "Observer ses pertes est l'un des moyens les plus fiables de repérer sa fenêtre de fertilité — bien avant les tests en pharmacie !",
    studyLabel:
      "Une étude de référence publiée dans Human Reproduction, menée sur 782 femmes et plus de 7 000 cycles, a démontré que la qualité observée de la glaire cervicale est un meilleur indicateur du jour de conception que le simple calcul du jour d'ovulation.",
    studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/14990542/',
  },
  {
    id: 'ballonnements',
    emoji: '🎈',
    title: 'Les Ballonnements',
    color: LAVENDER,
    mechanism:
      "La progestérone est un relaxant musculaire naturel. En détendant l'utérus, elle détend aussi malencontreusement les muscles du tube digestif. Le transit ralentit, provoquant de la constipation et une accumulation de gaz. De plus, les fluctuations hormonales poussent le corps à stocker temporairement plus d'eau intracellulaire.",
    funFact:
      "Bienvenue à bord de la montgolfière ! Si vous avez l'impression d'avoir gonflé d'une taille de pantalon entre le matin et le soir, c'est tout à fait normal.",
    studyLabel:
      "Une étude sur les symptômes gastro-intestinaux chez des femmes en bonne santé a démontré que 73% d'entre elles rapportent au moins un symptôme digestif (dont les ballonnements) dans les jours précédant ou pendant leurs règles, en raison du ralentissement du transit lié à la progestérone.",
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3901893/',
  },
  {
    id: 'cravings',
    emoji: '🍫',
    title: 'Les Envies de Sucre & Fringales',
    color: LAVENDER,
    mechanism:
      "Durant la phase lutéale (avant les règles), la chute des œstrogènes entraîne une baisse de la sérotonine (l'hormone du bonheur). Pour compenser et fabriquer rapidement cette sérotonine, le cerveau réclame du sucre et des glucides simples (chocolat, pâtes, chips). De plus, le corps brûle plus de calories durant cette phase, ce qui augmente l'appétit réel.",
    funFact:
      "Non, vous n'avez pas un manque de volonté, c'est de la neurochimie ! Votre cerveau réclame du chocolat comme un médicament pour fabriquer de la bonne humeur. Optez pour le chocolat noir : le magnésium qu'il contient aide aussi à détendre les muscles.",
    studyLabel:
      "Une étude a démontré que l'apport calorique des femmes augmente naturellement en phase lutéale par rapport à la phase folliculaire (9,27 vs 8,01 MJ/jour), confirmant l'augmentation réelle des besoins énergétiques et de l'appétit durant cette période.",
    studyUrl: 'https://pubmed.ncbi.nlm.nih.gov/7825535/',
  },
  {
    id: 'seins',
    emoji: '🍒',
    title: 'Les Seins Douloureux (Mastodynie)',
    color: LAVENDER,
    mechanism:
      "Au cours de la phase lutéale, la hausse de la progestérone stimule la croissance des lobules et des canaux mammaires. Cela provoque un engorgement, une plus grande vascularisation et une légère rétention d'eau dans les tissus de la poitrine, rendant les seins lourds, tendus et hypersensibles au moindre frottement.",
    funFact:
      "Vos seins passent temporairement en mode « chantier interdit au public ». Vous gagnez parfois une demi-taille de bonnet, mais avec l'option « ne pas toucher ».",
    studyLabel:
      "Une revue de référence publiée dans Mayo Clinic Proceedings sur l'évaluation et la prise en charge de la douleur mammaire détaille le lien entre le cycle hormonal (phase lutéale) et la mastalgie cyclique, ainsi que les changements tissulaires (engorgement des lobules, œdème stromal) associés.",
    studyUrl: 'https://www.mayoclinicproceedings.org/article/S0025-6196(11)62869-3/fulltext',
  },
  {
    id: 'migraine',
    emoji: '🤕',
    title: 'La Migraine Hormonale',
    color: LAVENDER,
    mechanism:
      "Ce mal de tête se déclenche généralement dans les jours précédant les règles. Il est provoqué par la chute rapide du taux d'œstrogènes. Cette baisse perturbe les niveaux de sérotonine et sensibilise les vaisseaux sanguins du cerveau, déclenchant une inflammation douloureuse.",
    funFact:
      "C'est le syndrome du sevrage ! Votre cerveau adore les œstrogènes. Quand le stock s'effondre juste avant les règles, votre système nerveux fait une petite crise de colère.",
    studyLabel:
      "Les critères diagnostiques de l'International Classification of Headache Disorders (ICHD-3), publiés par l'International Headache Society dans Cephalalgia, valident médicalement la « migraine menstruelle pure » et la lient directement à la chute d'œstrogènes en fin de phase lutéale.",
    studyUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9535967/',
  },
  {
    id: 'insomnie',
    emoji: '🥱',
    title: "L'Insomnie Prémenstruelle",
    color: LAVENDER,
    mechanism:
      "Juste avant les règles, la chute de la progestérone (qui est normalement une hormone calmante et sédative) perturbe les cycles du sommeil. De plus, la température corporelle augmente après l'ovulation et reste élevée. Or, pour s'endormir profondément, le corps a physiologiquement besoin de baisser sa température interne.",
    funFact:
      "Si vous vous tournez et retournez dans votre lit à J-2 des règles, c'est que votre thermostat interne est déréglé. Votre corps est en mode « surchauffe » hormonale. Dormir dans une chambre bien fraîche (18°C) ou prendre une douche tiède avant le coucher aide à tricher.",
    studyLabel:
      "Une revue sur les mécanismes neurobiologiques et hormonaux régulant le sommeil des femmes met en évidence que le sommeil paradoxal (REM) est significativement réduit durant la phase lutéale tardive, en lien avec la thermorégulation instable liée à la progestérone.",
    studyUrl: 'https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2020.625397/full',
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

export function getTopicById(id: string): BodyArticleContent | undefined {
  return TOPIC_ARTICLES.find((a) => a.id === id);
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
