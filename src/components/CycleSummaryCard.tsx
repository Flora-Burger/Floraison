import { StyleSheet, Text, View } from 'react-native';
import type { CycleData } from '../types/cycle';
import { getCycleThreeLineSummary } from '../lib/cycleSummary';
import { todayKey } from '../lib/dates';
import { BG_SOFT, BORDER, MUTED, ROSE_DEEP, TEXT } from '../constants/theme';
import { useMemo } from 'react';

type CycleSummaryCardProps = {
  data: CycleData;
};

export function CycleSummaryCard({ data }: CycleSummaryCardProps) {
  const summary = useMemo(() => getCycleThreeLineSummary(data, todayKey()), [data]);
  if (!summary) return null;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${summary.line1}. ${summary.line2}. ${summary.line3}`}
    >
      <Text style={styles.title}>Ce cycle en 3 lignes</Text>
      <Text style={styles.line}>{summary.line1}</Text>
      <Text style={styles.line}>{summary.line2}</Text>
      <Text style={styles.line}>{summary.line3}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginBottom: 10,
  },
  line: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT,
    marginBottom: 6,
  },
});
