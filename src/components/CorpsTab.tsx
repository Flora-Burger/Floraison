import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  Platform,
  View,
} from 'react-native';
import type { CycleData } from '../types/cycle';
import { CYCLE_PHASES, TOPIC_ARTICLES, formatPhaseHero, getPhaseById } from '../constants/cycleContent';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { todayKey } from '../lib/dates';
import { CycleWheel } from './CycleWheel';
import {
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE_DEEP,
  SAGE_LIGHT,
  TEXT,
} from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CorpsTabProps = {
  data: CycleData;
};

export function CorpsTab({ data }: CorpsTabProps) {
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);
  const hero = ctx ? formatPhaseHero(getPhaseById(ctx.phase)) : null;

  const togglePhase = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenPhaseId(openPhaseId === id ? null : id);
  };

  const toggleTopic = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenTopicId(openTopicId === id ? null : id);
  };

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <Text style={styles.corpsIntro}>Comprendre mon corps</Text>

      {hero && ctx ? (
        <View style={[styles.heroCard, { borderColor: getPhaseById(ctx.phase).color }]}>
          <Text style={styles.heroHeadline}>{hero.headline}</Text>
          <Text style={styles.heroSubtitle}>{hero.subtitle}</Text>
          <Text style={styles.heroSymptoms}>{hero.symptomsLine}</Text>
          <CycleWheel context={ctx} />
        </View>
      ) : (
        <View style={styles.heroCardEmpty}>
          <Text style={styles.heroHeadline}>Phase inconnue</Text>
          <Text style={styles.heroSubtitle}>
            Enregistre au moins un jour de règles dans l'onglet Suivi pour voir ta phase actuelle.
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Les 4 phases du cycle</Text>
      {CYCLE_PHASES.map((phase) => {
        const isActive = ctx?.phase === phase.id;
        const isOpen = openPhaseId === phase.id;
        return (
          <TouchableOpacity
            key={phase.id}
            style={[
              styles.accordion,
              isActive && {
                backgroundColor: phase.color + '18',
                borderColor: phase.color,
                borderWidth: 2,
              },
            ]}
            onPress={() => togglePhase(phase.id)}
            activeOpacity={0.8}
          >
            <View style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>
                {phase.emoji} {phase.order}. {phase.title}
              </Text>
              <View style={styles.accordionHeaderRight}>
                {isActive ? (
                  <View style={[styles.badge, { backgroundColor: phase.color }]}>
                    <Text style={styles.badgeText}>Phase actuelle</Text>
                  </View>
                ) : null}
                <Text style={styles.accordionChevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>
            </View>
            {isOpen ? <Text style={styles.accordionBody}>{phase.body}</Text> : null}
          </TouchableOpacity>
        );
      })}

      <Text style={styles.sectionTitle}>En savoir plus</Text>
      {TOPIC_ARTICLES.map((article) => {
        const isOpen = openTopicId === article.id;
        return (
          <TouchableOpacity
            key={article.id}
            style={styles.accordion}
            onPress={() => toggleTopic(article.id)}
            activeOpacity={0.8}
          >
            <View style={styles.accordionHeader}>
              <Text style={styles.accordionTitle}>{article.title}</Text>
              <Text style={styles.accordionChevron}>{isOpen ? '▲' : '▼'}</Text>
            </View>
            {isOpen ? <Text style={styles.accordionBody}>{article.body}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1 },
  tabContent: { paddingBottom: 16 },
  corpsIntro: {
    fontSize: 20,
    fontWeight: '700',
    color: ROSE_DEEP,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: SAGE_LIGHT,
  },
  heroCardEmpty: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: BG_SOFT,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  heroHeadline: { fontSize: 18, fontWeight: '700', color: ROSE_DEEP, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: TEXT, lineHeight: 21, marginBottom: 8 },
  heroSymptoms: { fontSize: 13, color: MUTED, lineHeight: 19, marginBottom: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  accordion: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  accordionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accordionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: TEXT },
  accordionChevron: { fontSize: 12, color: MUTED },
  accordionBody: { marginTop: 10, fontSize: 14, color: MUTED, lineHeight: 21 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFCF9' },
});
