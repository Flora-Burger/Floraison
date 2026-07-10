import { useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { BookOpen } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import {
  CYCLE_PHASES,
  TOPIC_ARTICLES,
  type BodyArticleContent,
  formatPhaseHero,
  getPhaseById,
} from '../constants/cycleContent';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { todayKey } from '../lib/dates';
import { CycleWheel } from './CycleWheel';
import {
  BG,
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE,
  ROSE_DEEP,
  TEXT,
} from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CorpsTabProps = {
  data: CycleData;
  highlightTopicId?: string | null;
};

function BodyArticleCard({
  article,
  isOpen,
  onToggle,
  isActive,
  activeLabel,
}: {
  article: BodyArticleContent;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  activeLabel?: string;
}) {
  const accent = article.color;

  return (
    <TouchableOpacity
      style={[styles.articleCard, { borderColor: accent + '44' }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={[styles.articleCardTint, { backgroundColor: accent + '14' }]} />
      <View style={styles.articleCardInner}>
        <View style={styles.articleTopRow}>
          <View style={[styles.articleIconWrap, { backgroundColor: accent + '28' }]}>
            <Text style={styles.articleEmoji}>{article.emoji}</Text>
          </View>
          <View style={styles.articleTitleBlock}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            {isActive && activeLabel ? (
              <View style={[styles.activeChip, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
                <Text style={[styles.activeChipText, { color: accent }]}>{activeLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
        </View>

        {isOpen ? (
          <View style={styles.articleBody}>
            <Text style={styles.sectionLabel}>Le mécanisme en détail</Text>
            <Text style={styles.sectionText}>{article.mechanism}</Text>

            <Text style={styles.sectionLabel}>La touche ludique</Text>
            <Text style={styles.sectionText}>{article.funFact}</Text>

            <Text style={styles.sectionLabel}>L'étude scientifique</Text>
            <Text style={styles.sectionText}>{article.studyLabel}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(article.studyUrl)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.studyLink}>Voir l'étude →</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function CorpsTab({ data, highlightTopicId }: CorpsTabProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightTopicId) {
      setOpenId(highlightTopicId);
    }
  }, [highlightTopicId]);

  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);
  const hero = ctx ? formatPhaseHero(getPhaseById(ctx.phase)) : null;

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(openId === id ? null : id);
  };

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <BookOpen size={22} weight="fill" color={ROSE_DEEP} />
        </View>
        <View>
          <Text style={styles.intro}>Comprendre mon corps</Text>
          <Text style={styles.introSub}>Cycle, hormones et symptômes expliqués</Text>
        </View>
      </View>

      {hero && ctx ? (
        <View style={[styles.phaseCard, { borderColor: getPhaseById(ctx.phase).color + '88' }]}>
          <View
            style={[styles.phaseCardGlow, { backgroundColor: getPhaseById(ctx.phase).color + '18' }]}
          />
          <Text style={styles.phaseEmoji}>{getPhaseById(ctx.phase).emoji}</Text>
          <Text style={styles.phaseCardTitle}>Aujourd'hui</Text>
          <Text style={styles.phaseCardHeadline}>{hero.headline}</Text>
          <Text style={styles.phaseCardSymptoms}>{hero.symptomsLine}</Text>
          <CycleWheel data={data} />
        </View>
      ) : (
        <View style={styles.emptyHero}>
          <Text style={styles.emptyHeroTitle}>Phase inconnue</Text>
          <Text style={styles.emptyHeroBody}>
            Enregistre au moins un jour de règles dans l'onglet Suivi pour voir ta phase actuelle.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Les 4 phases du cycle</Text>
        <Text style={styles.sectionHint}>Ce qui se passe dans ton corps à chaque étape</Text>
        {CYCLE_PHASES.map((phase) => (
          <BodyArticleCard
            key={phase.id}
            article={phase}
            isOpen={openId === phase.id}
            onToggle={() => toggle(phase.id)}
            isActive={ctx?.phase === phase.id}
            activeLabel="Phase actuelle"
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>En savoir plus</Text>
        <Text style={styles.sectionHint}>Symptômes, mécanismes et études</Text>
        {TOPIC_ARTICLES.map((article) => (
          <BodyArticleCard
            key={article.id}
            article={article}
            isOpen={openId === article.id}
            onToggle={() => toggle(article.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1, backgroundColor: BG },
  tabContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ROSE + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ROSE + '33',
  },
  intro: {
    fontSize: 22,
    fontWeight: '800',
    color: ROSE_DEEP,
    letterSpacing: -0.3,
  },
  introSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
    lineHeight: 18,
  },
  phaseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  phaseCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  phaseEmoji: { fontSize: 28, marginBottom: 6 },
  phaseCardTitle: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  phaseCardHeadline: {
    fontSize: 17,
    color: TEXT,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 2,
  },
  phaseCardSymptoms: { fontSize: 13, color: MUTED, lineHeight: 19, marginTop: 6, marginBottom: 8 },
  emptyHero: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: BG_SOFT,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyHeroTitle: { fontSize: 17, fontWeight: '700', color: ROSE_DEEP, marginBottom: 6 },
  emptyHeroBody: { fontSize: 14, color: MUTED, lineHeight: 21 },
  section: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
    lineHeight: 18,
  },
  articleCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  articleCardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  articleCardInner: { padding: 14 },
  articleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  articleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleEmoji: { fontSize: 20 },
  articleTitleBlock: { flex: 1, gap: 6 },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 20,
  },
  activeChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  activeChipText: { fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 12, color: MUTED, marginTop: 4 },
  articleBody: { marginTop: 14, gap: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ROSE_DEEP,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionText: { fontSize: 14, color: TEXT, lineHeight: 21 },
  studyLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginTop: 6,
    marginBottom: 4,
  },
});
