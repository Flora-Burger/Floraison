import { StyleSheet, Text, View } from 'react-native';
import { ChartLine, Pulse } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import {
  computeCycleCompare,
  computeReliabilityScore,
} from '../lib/cycleCompare';
import { todayKey } from '../lib/dates';
import { BG_SOFT, BORDER, MUTED, ROSE, ROSE_DEEP, SAGE, TEXT } from '../constants/theme';
import { useMemo } from 'react';

type CycleCompareSectionProps = {
  data: CycleData;
};

export function CycleCompareSection({ data }: CycleCompareSectionProps) {
  const compare = useMemo(() => computeCycleCompare(data, todayKey()), [data]);
  const reliability = useMemo(() => computeReliabilityScore(data), [data]);

  const barColor =
    reliability.level === 'high'
      ? SAGE
      : reliability.level === 'medium'
        ? ROSE
        : MUTED;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Pulse size={18} weight="duotone" color={ROSE_DEEP} />
          <Text style={styles.title}>Fiabilité du suivi</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreNumber, { color: barColor }]}>
            {reliability.score}
          </Text>
          <View style={styles.scoreCopy}>
            <Text style={styles.scoreLabel}>{reliability.label}</Text>
            <Text style={styles.scoreDetail}>{reliability.detail}</Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${reliability.score}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>

      {compare.ready ? (
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
              <Text style={styles.statValue}>
                {compare.previousLength ?? '—'}
              </Text>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 10,
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
    fontWeight: '800',
    color: TEXT,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '800',
    minWidth: 44,
  },
  scoreCopy: { flex: 1 },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
  },
  scoreDetail: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    lineHeight: 17,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: BORDER,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
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
    color: ROSE_DEEP,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  lateChip: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: ROSE + '18',
    borderWidth: 1,
    borderColor: ROSE + '44',
  },
  lateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: ROSE_DEEP,
  },
});
