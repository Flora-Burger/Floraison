import { StyleSheet, Text, View } from 'react-native';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { getPhaseById } from '../constants/cycleContent';
import { todayKey } from '../lib/dates';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { useMemo } from 'react';
import { usePhaseAccent } from '../context/PhaseAccentContext';

const PHASE_ORDER: CyclePhaseId[] = [
  'menstruelle',
  'folliculaire',
  'ovulatoire',
  'luteale',
];

const SHORT: Record<CyclePhaseId, string> = {
  menstruelle: 'Règles',
  folliculaire: 'Foll.',
  ovulatoire: 'Ovul.',
  luteale: 'Lutéale',
};

type CurrentCycleTimelineProps = {
  data: CycleData;
};

export function CurrentCycleTimeline({ data }: CurrentCycleTimelineProps) {
  const { accent } = usePhaseAccent();
  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  if (!ctx) return null;

  const position = Math.min(
    Math.max((ctx.cycleDay - 0.5) / ctx.cycleLength, 0.02),
    0.98,
  );

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Timeline du cycle, jour ${ctx.cycleDay} sur ${ctx.cycleLength}, phase ${ctx.phase}`}
    >
      <Text style={styles.hint}>
        Jour {ctx.cycleDay} / ~{ctx.cycleLength} · {getPhaseById(ctx.phase).shortTitle}
      </Text>
      <View style={styles.bar}>
        {PHASE_ORDER.map((id) => {
          const flex = Math.max(ctx.segmentDays[id], 0);
          if (flex <= 0) return null;
          const active = ctx.phase === id;
          return (
            <View
              key={id}
              style={[
                styles.seg,
                {
                  flex,
                  backgroundColor: getPhaseById(id).color + (active ? 'CC' : '44'),
                },
              ]}
            />
          );
        })}
        <View style={[styles.marker, { left: `${position * 100}%` }]}>
          <View style={[styles.markerDot, { backgroundColor: accent.accent }]} />
          <Text style={styles.markerLabel}>Ici</Text>
        </View>
      </View>
      <View style={styles.labels}>
        {PHASE_ORDER.map((id) => {
          const flex = Math.max(ctx.segmentDays[id], 0);
          if (flex <= 0) return null;
          return (
            <Text key={id} style={[styles.label, { flex }]} numberOfLines={1}>
              {SHORT[id]}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  hint: { fontSize: 12, fontWeight: '700', color: TEXT, marginBottom: 8 },
  bar: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  seg: { height: '100%' },
  marker: {
    position: 'absolute',
    top: -3,
    marginLeft: -7,
    alignItems: 'center',
    width: 14,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFCF9',
  },
  markerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    marginTop: 2,
  },
  labels: { flexDirection: 'row', marginTop: 6 },
  label: { fontSize: 10, color: MUTED, textAlign: 'center' },
});
