import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CycleData } from '../types/cycle';
import { computeSymptomCorrelations } from '../lib/cycleInsights';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { formatPhaseHero, getPhaseById } from '../constants/cycleContent';
import { todayKey } from '../lib/dates';
import {
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE,
  ROSE_DEEP,
  SAGE_LIGHT,
  TEXT,
} from '../constants/theme';

type InsightsTabProps = {
  data: CycleData;
};

export function InsightsTab({ data }: InsightsTabProps) {
  const result = useMemo(() => computeSymptomCorrelations(data), [data]);
  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  const phaseSummary = ctx
    ? formatPhaseHero(getPhaseById(ctx.phase))
    : null;

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <Text style={styles.intro}>Tes insights personnalisés</Text>

      {phaseSummary ? (
        <View style={styles.phaseCard}>
          <Text style={styles.phaseCardTitle}>Aujourd'hui</Text>
          <Text style={styles.phaseCardHeadline}>{phaseSummary.headline}</Text>
        </View>
      ) : null}

      {!result.ready ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Pas encore assez de données</Text>
          <Text style={styles.emptyBody}>
            Continue à logger tes symptômes, tes insights personnalisés arrivent bientôt.
          </Text>
          <Text style={styles.emptyProgress}>
            Cycles enregistrés : {result.cycleCount} / {result.minCyclesRequired}
          </Text>
        </View>
      ) : result.insights.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune corrélation forte pour l'instant</Text>
          <Text style={styles.emptyBody}>
            Continue à noter tes symptômes chaque jour. Les patterns apparaîtront quand un
            symptôme dépasse 50 % d'une phase.
          </Text>
        </View>
      ) : (
        <View style={styles.insightsList}>
          <Text style={styles.sectionLabel}>Tes corrélations</Text>
          {result.insights.map((insight) => (
            <View key={`${insight.symptomKey}-${insight.phase}`} style={styles.insightCard}>
              <View style={styles.insightAccent} />
              <Text style={styles.insightText}>{insight.sentence}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1 },
  tabContent: { paddingBottom: 16 },
  intro: {
    fontSize: 20,
    fontWeight: '700',
    color: ROSE_DEEP,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  phaseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: BG_SOFT,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: SAGE_LIGHT,
  },
  phaseCardTitle: { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 4 },
  phaseCardHeadline: { fontSize: 15, color: TEXT, fontWeight: '600', lineHeight: 22 },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: MUTED, lineHeight: 21 },
  emptyProgress: { fontSize: 13, color: ROSE, fontWeight: '600', marginTop: 12 },
  insightsList: { paddingHorizontal: 16, gap: 10 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
    marginTop: 4,
  },
  insightCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  insightAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: ROSE,
  },
  insightText: { fontSize: 14, color: TEXT, lineHeight: 21, paddingLeft: 4 },
});
