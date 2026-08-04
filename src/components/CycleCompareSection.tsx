import { StyleSheet, Text, View } from 'react-native';
import { ChartLine } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { computeCycleCompare } from '../lib/cycleCompare';
import { todayKey } from '../lib/dates';
import { BG_SOFT, BORDER, MUTED, ROSE, TEXT } from '../constants/theme';
import { useMemo } from 'react';

type CycleCompareSectionProps = {
  data: CycleData;
};

/** Comparaison cycle en cours vs précédent — sans score de fiabilité (doublon). */
export function CycleCompareSection({ data }: CycleCompareSectionProps) {
  const compare = useMemo(() => computeCycleCompare(data, todayKey()), [data]);

  if (!compare.ready) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <ChartLine size={18} weight="duotone" color={ROSE} />
          <Text style={styles.title}>Ce cycle vs le précédent</Text>
        </View>
        <Text style={styles.summary}>{compare.summary}</Text>
        {compare.hardDaysLine ? (
          <Text style={styles.hardLine}>{compare.hardDaysLine}</Text>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{compare.currentDay}</Text>
            <Text style={styles.statLabel}>Jour actuel</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{compare.previousLength ?? '—'}</Text>
            <Text style={styles.statLabel}>Cycle préc.</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{compare.averageLength}</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
        </View>
        {compare.periodDueOrLate ? (
          <View style={styles.lateChip}>
            <Text style={styles.lateChipText}>
              {compare.overdueDays > 0
                ? `Règles en retard · ${compare.overdueDays} j`
                : 'Règles attendues aujourd’hui'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginBottom: 8,
  },
  hardLine: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
    marginBottom: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  lateChip: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: ROSE + '14',
    borderWidth: 1,
    borderColor: ROSE + '44',
  },
  lateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ROSE,
    textAlign: 'center',
  },
});
