import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { BLOOM_COMPASS_LABELS } from '../constants/creativeVoice';
import { todayKey } from '../lib/dates';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { PHASE_ACCENTS } from '../constants/phaseAccent';

const ORDER: CyclePhaseId[] = ['menstruelle', 'folliculaire', 'ovulatoire', 'luteale'];

type BloomCompassProps = {
  data: CycleData;
};

/** Boussole florale — où tu es dans le jardin du cycle, pas un donut dashboard. */
export function BloomCompass({ data }: BloomCompassProps) {
  const { accent } = usePhaseAccent();
  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  if (!ctx) return null;

  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const stroke = 14;

  const total = ORDER.reduce((s, id) => s + Math.max(ctx.segmentDays[id], 1), 0);
  let angle = -Math.PI / 2;
  const arcs = ORDER.map((id) => {
    const days = Math.max(ctx.segmentDays[id], 1);
    const sweep = (days / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { id, start, end, active: ctx.phase === id };
  });

  const progressAngle =
    -Math.PI / 2 + ((ctx.cycleDay - 0.5) / Math.max(ctx.cycleLength, 1)) * Math.PI * 2;
  const nx = cx + Math.cos(progressAngle) * (r - 4);
  const ny = cy + Math.sin(progressAngle) * (r - 4);

  const label = BLOOM_COMPASS_LABELS[ctx.phase];

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Boussole florale : ${label.full}, jour ${ctx.cycleDay} sur ${ctx.cycleLength}`}
    >
      <Text style={styles.kicker}>Boussole florale</Text>
      <View style={styles.row}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r + stroke / 2 + 2} fill="#FFFCF9" stroke={BORDER} strokeWidth={1} />
          {arcs.map((arc) => {
            const color = PHASE_ACCENTS[arc.id].accent;
            const path = describeArc(cx, cy, r, arc.start, arc.end);
            return (
              <Path
                key={arc.id}
                d={path}
                stroke={color}
                strokeWidth={arc.active ? stroke + 2 : stroke}
                strokeOpacity={arc.active ? 1 : 0.35}
                fill="none"
                strokeLinecap="butt"
              />
            );
          })}
          <Circle cx={cx} cy={cy} r={36} fill={accent.accent + '18'} />
          <Circle cx={nx} cy={ny} r={7} fill={accent.accent} stroke="#FFFCF9" strokeWidth={2} />
        </Svg>
        <View style={styles.copy}>
          <Text style={[styles.phase, { color: accent.accent }]}>{label.full}</Text>
          <Text style={styles.meta}>
            Jour {ctx.cycleDay} · cercle ~{ctx.cycleLength} j
          </Text>
          <View style={styles.legend}>
            {ORDER.map((id) => (
              <Text
                key={id}
                style={[
                  styles.legendItem,
                  ctx.phase === id && { color: PHASE_ACCENTS[id].accent, fontWeight: '800' },
                ]}
              >
                {BLOOM_COMPASS_LABELS[id].short}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + Math.cos(start) * r;
  const y1 = cy + Math.sin(start) * r;
  const x2 = cx + Math.cos(end) * r;
  const y2 = cy + Math.sin(end) * r;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copy: { flex: 1, paddingRight: 4 },
  phase: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  meta: { fontSize: 12, color: MUTED, marginBottom: 10 },
  legend: { gap: 4 },
  legendItem: { fontSize: 12, color: MUTED, fontWeight: '600' },
});
