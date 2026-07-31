import { useEffect, useMemo, useRef, useState } from 'react';
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
  type LayoutChangeEvent,
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
import { usePhaseAccent } from '../context/PhaseAccentContext';
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
  onHighlightConsumed?: () => void;
};

function BodyArticleCard({
  article,
  isOpen,
  onToggle,
  isActive,
  activeLabel,
  isHighlighted,
  onLayout,
}: {
  article: BodyArticleContent;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  activeLabel?: string;
  isHighlighted?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const accent = article.color;

  return (
    <View onLayout={onLayout}>
      <TouchableOpacity
        style={[
          styles.articleCard,
          {
            borderColor: isHighlighted ? accent : accent + '44',
            borderWidth: isHighlighted ? 2 : 1,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${article.title}${isOpen ? ', ouvert' : ''}`}
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
                <View
                  style={[
                    styles.activeChip,
                    { backgroundColor: accent + '22', borderColor: accent + '66' },
                  ]}
                >
                  <Text style={[styles.activeChipText, { color: accent }]}>{activeLabel}</Text>
                </View>
              ) : null}
              {isHighlighted ? (
                <View
                  style={[
                    styles.activeChip,
                    { backgroundColor: accent + '22', borderColor: accent + '66', marginTop: 4 },
                  ]}
                >
                  <Text style={[styles.activeChipText, { color: accent }]}>Depuis Insights</Text>
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
                accessibilityRole="link"
                accessibilityLabel={`Voir l'étude : ${article.title}`}
              >
                <Text style={styles.studyLink}>Voir l'étude →</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function CorpsTab({
  data,
  highlightTopicId,
  onHighlightConsumed,
}: CorpsTabProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const yById = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!highlightTopicId) return;
    setOpenId(highlightTopicId);
    setFlashId(highlightTopicId);
    const t = setTimeout(() => {
      const y = yById.current[highlightTopicId];
      if (typeof y === 'number' && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, y - 24), animated: true });
      }
      onHighlightConsumed?.();
    }, 120);
    const clearFlash = setTimeout(() => setFlashId(null), 2800);
    return () => {
      clearTimeout(t);
      clearTimeout(clearFlash);
    };
  }, [highlightTopicId, onHighlightConsumed]);

  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);
  const hero = ctx ? formatPhaseHero(getPhaseById(ctx.phase)) : null;
  const { accent } = usePhaseAccent();

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(openId === id ? null : id);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContent}
    >
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <BookOpen size={22} weight="fill" color={accent.accent} />
        </View>
        <View>
          <Text style={styles.intro}>Comprendre mon corps</Text>
          <Text style={styles.introSub}>Cycle, hormones et symptômes expliqués</Text>
        </View>
      </View>

      {hero && ctx ? (
        <View style={[styles.phaseCard, { borderColor: accent.accent + '99' }]}>
          <View
            style={[styles.phaseCardGlow, { backgroundColor: accent.accent + '18' }]}
          />
          <Text style={styles.phaseEmoji}>{getPhaseById(ctx.phase).emoji}</Text>
          <Text style={[styles.phaseCardTitle, { color: accent.accent }]}>Aujourd'hui</Text>
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

      <View
        style={styles.section}
        onLayout={(e) => {
          yById.current.__phases = e.nativeEvent.layout.y;
        }}
      >
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
            isHighlighted={flashId === phase.id}
            onLayout={(e) => {
              yById.current[phase.id] =
                (yById.current.__phases ?? 0) + e.nativeEvent.layout.y;
            }}
          />
        ))}
      </View>

      <View
        style={styles.section}
        onLayout={(e) => {
          yById.current.__topics = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.sectionTitle}>En savoir plus</Text>
        <Text style={styles.sectionHint}>Symptômes, mécanismes et études</Text>
        {TOPIC_ARTICLES.map((article) => (
          <BodyArticleCard
            key={article.id}
            article={article}
            isOpen={openId === article.id}
            onToggle={() => toggle(article.id)}
            isHighlighted={flashId === article.id}
            onLayout={(e) => {
              yById.current[article.id] =
                (yById.current.__topics ?? 0) + e.nativeEvent.layout.y;
            }}
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
    padding: 16,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  phaseCardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  phaseEmoji: { fontSize: 28, marginBottom: 6 },
  phaseCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  phaseCardHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  phaseCardSymptoms: { fontSize: 13, color: MUTED, lineHeight: 19, marginBottom: 8 },
  emptyHero: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyHeroTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptyHeroBody: { fontSize: 13, color: MUTED, lineHeight: 19 },
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 4 },
  sectionHint: { fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 18 },
  articleCard: {
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  articleCardTint: { ...StyleSheet.absoluteFillObject },
  articleCardInner: { padding: 14 },
  articleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  articleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleEmoji: { fontSize: 20 },
  articleTitleBlock: { flex: 1 },
  articleTitle: { fontSize: 15, fontWeight: '700', color: TEXT },
  chevron: { fontSize: 11, color: MUTED },
  activeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeChipText: { fontSize: 11, fontWeight: '700' },
  articleBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionText: { fontSize: 13, color: TEXT, lineHeight: 20 },
  studyLink: { fontSize: 13, fontWeight: '700', color: ROSE, marginTop: 8 },
});
