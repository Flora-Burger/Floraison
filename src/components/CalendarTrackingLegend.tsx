import { StyleSheet, Text, View } from 'react-native';
import { TRACK_COLORS, MUTED } from '../constants/theme';
import { CATEGORY_LABELS } from '../lib/cycleInsights';

const LEGEND_ITEMS = [
  { key: 'discharge' as const, label: 'Pertes' },
  { key: 'physical' as const, label: 'Physique' },
  { key: 'skin' as const, label: 'Peau' },
  { key: 'mood' as const, label: 'Humeur' },
  { key: 'sleep' as const, label: 'Sommeil' },
  { key: 'cravings' as const, label: 'Envies' },
  { key: 'sexual' as const, label: 'Libido' },
];

export function CalendarTrackingLegend() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Points de suivi</Text>
      <View style={styles.row}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.key} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: TRACK_COLORS[item.key] }]} />
            <Text style={styles.label}>{CATEGORY_LABELS[item.key]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 10, color: MUTED, fontWeight: '500' },
});
