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
import { CaretDown, CaretUp } from 'phosphor-react-native';
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
          isHighlighted && { borderColor: accent },
          isOpen && styles.articleCardOpen,
        ]}
        onPress={onToggle}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${article.title}${isOpen ? ', ouvert' : ''}`}
      >
        <View style={[styles.articleRail, { backgroundColor: accent }]} />
        <View style={styles.articleCardInner}>
          <View style={styles.articleTopRow}>
            <View style={styles.articleTitleBlock}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              {isActive && activeLabel ? (
                <Text style={[styles.metaLine, { color: accent }]}>{activeLabel}</Text>
              ) : null}
              {isHighlighted ? (
                <Text style={[styles.metaLine, { color: accent }]}>Depuis Insights</Text>
              ) : null}
            </View>
            {isOpen ? (
              <CaretUp size={16} color={MUTED} weight="bold" />
            ) : (
              <CaretDown size={16} color={MUTED} weight="bold" />
            )}
          </View>

          {isOpen ? (
            <View style={styles.articleBody}>
              <Text style={styles.detailLabel}>Mécanisme</Text>
              <Text style={styles.detailText}>{article.mechanism}</Text>

              <Text style={styles.detailLabel}>À retenir</Text>
              <Text style={styles.detailText}>{article.funFact}</Text>

              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailText}>{article.studyLabel}</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(article.studyUrl)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="link"
                accessibilityLabel={`Voir l'étude : ${article.title}`}
              >
                <Text style={[styles.studyLink, { color: accent }]}>Lire l’étude</Text>
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
  const { accent, chrome } = usePhaseAccent();
  const phase = ctx ? getPhaseById(ctx.phase) : null;

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
        <Text style={[styles.kicker, { color: chrome }]}>Corps</Text>
        <Text style={styles.intro}>Ce qui se passe maintenant</Text>
        <Text style={styles.introSub}>
          Phase en cours, puis les articles pour comprendre mécanismes et symptômes.
        </Text>
      </View>

      {hero && ctx && phase ? (
        <View style={styles.hero}>
          <View style={[styles.heroBar, { backgroundColor: accent.accent }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroPhase, { color: accent.accent }]}>
              {phase.shortTitle}
            </Text>
            <Text style={styles.heroDay}>Jour {ctx.cycleDay}</Text>
            <Text style={styles.heroHeadline}>{hero.headline}</Text>
            <Text style={styles.heroSymptoms}>{hero.symptomsLine}</Text>
          </View>
          <View style={styles.wheelWrap}>
            <CycleWheel data={data} size={220} />
          </View>
        </View>
      ) : (
        <View style={styles.emptyHero}>
          <Text style={styles.emptyHeroTitle}>Pas encore de phase</Text>
          <Text style={styles.emptyHeroBody}>
            Note un jour de règles dans Suivi — Corps affichera ta phase et la roue du cycle.
          </Text>
        </View>
      )}

      <View
        style={styles.section}
        onLayout={(e) => {
          yById.current.__phases = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.sectionTitle}>Les quatre phases</Text>
        <Text style={styles.sectionHint}>Ouvre celle qui t’intéresse</Text>
        {CYCLE_PHASES.map((p) => (
          <BodyArticleCard
            key={p.id}
            article={p}
            isOpen={openId === p.id}
            onToggle={() => toggle(p.id)}
            isActive={ctx?.phase === p.id}
            activeLabel="En cours"
            isHighlighted={flashId === p.id}
            onLayout={(e) => {
              yById.current[p.id] =
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
        <Text style={styles.sectionTitle}>Symptômes & mécanismes</Text>
        <Text style={styles.sectionHint}>Textes courts, avec source</Text>
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
  tabContent: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 6,
  },
  intro: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  introSub: {
    fontSize: 14,
    color: MUTED,
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 340,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  heroBar: {
    height: 4,
    width: '100%',
  },
  heroCopy: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  heroPhase: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroDay: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    marginBottom: 8,
  },
  heroHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    lineHeight: 22,
    marginBottom: 6,
  },
  heroSymptoms: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  wheelWrap: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 4,
  },
  emptyHero: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyHeroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  emptyHeroBody: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 12,
    lineHeight: 18,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
    overflow: 'hidden',
  },
  articleCardOpen: {
    backgroundColor: BG_SOFT,
  },
  articleRail: {
    width: 4,
  },
  articleCardInner: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  articleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  articleTitleBlock: { flex: 1 },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 20,
  },
  metaLine: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  articleBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  detailText: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 21,
  },
  studyLink: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
});
