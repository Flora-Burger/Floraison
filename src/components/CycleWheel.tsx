import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { getPhaseById, CYCLE_PHASES } from '../constants/cycleContent';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import {
  ROSE,
  ROSE_DEEP,
  SAGE,
  TEXT,
  MUTED,
} from '../constants/theme';
import { parseDateKey, todayKey } from '../lib/dates';
import {
  cycleDayToDate,
  getCycleContextForDate,
  getDaysUntilNextPeriod,
} from '../lib/cyclePhase';

const PHASE_ORDER: CyclePhaseId[] = ['menstruelle', 'folliculaire', 'ovulatoire', 'luteale'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function touchToCycleDay(x: number, y: number, cx: number, cy: number, cycleLength: number): number {
  const dx = x - cx;
  const dy = y - cy;
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angleDeg < 0) angleDeg += 360;
  const raw = (angleDeg / 360) * cycleLength;
  const day = Math.round(raw) || 1;
  return Math.max(1, Math.min(cycleLength, day));
}

function cycleDayToAngle(cycleDay: number, cycleLength: number): number {
  return ((cycleDay - 0.5) / cycleLength) * 360;
}

function formatDateLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

function formatPeriodCountdown(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return 'Règles prévues aujourd\'hui';
  if (days === 1) return 'Règles prévues demain';
  return `Règles dans ${days} jours`;
}

type CycleWheelProps = {
  data: CycleData;
  size?: number;
};

export function CycleWheel({ data, size = 260 }: CycleWheelProps) {
  const baseCtx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);
  const todayCycleDay = baseCtx?.cycleDay ?? 1;

  const [selectedDay, setSelectedDay] = useState(todayCycleDay);

  useEffect(() => {
    if (baseCtx) setSelectedDay(baseCtx.cycleDay);
  }, [baseCtx?.cycleDay, baseCtx?.periodStart]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const innerR = outerR * 0.52;
  const indicatorR = (outerR + innerR) / 2;

  if (!baseCtx) return null;

  const { cycleLength, segmentDays, periodStart } = baseCtx;
  const selectedDate = cycleDayToDate(periodStart, selectedDay);
  const selectedCtx = getCycleContextForDate(data, selectedDate);
  const phaseContent = selectedCtx ? getPhaseById(selectedCtx.phase) : null;
  const daysUntilPeriod = getDaysUntilNextPeriod(data, selectedDate);
  const isToday = selectedDate === todayKey();
  const isTodayOnWheel = todayCycleDay !== selectedDay;

  const phaseColors = Object.fromEntries(CYCLE_PHASES.map((p) => [p.id, p.color])) as Record<
    CyclePhaseId,
    string
  >;

  let angle = 0;
  const segments = PHASE_ORDER.map((phaseId) => {
    const days = segmentDays[phaseId];
    const sweep = days > 0 ? (days / cycleLength) * 360 : 0;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    return { phaseId, startAngle, endAngle, sweep, color: phaseColors[phaseId] };
  }).filter((s) => s.sweep > 0);

  const selectedAngle = cycleDayToAngle(selectedDay, cycleLength);
  const selectedPos = polarToCartesian(cx, cy, indicatorR, selectedAngle);
  const todayPos = polarToCartesian(cx, cy, indicatorR, cycleDayToAngle(todayCycleDay, cycleLength));

  const updateFromTouch = (x: number, y: number) => {
    setSelectedDay(touchToCycleDay(x, y, cx, cy, cycleLength));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderMove: (evt) => {
        updateFromTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.wheelBox, { width: size, height: size }]}
        {...panResponder.panHandlers}
      >
        <Svg width={size} height={size}>
          <G>
            {segments.map((seg) => (
              <Path
                key={seg.phaseId}
                d={describeArc(cx, cy, outerR, seg.startAngle, seg.endAngle)}
                fill={seg.color}
                opacity={0.88}
              />
            ))}
            <Circle cx={cx} cy={cy} r={innerR} fill="#FFFCF9" />
            {isTodayOnWheel ? (
              <Circle
                cx={todayPos.x}
                cy={todayPos.y}
                r={6}
                fill={SAGE}
                stroke="#FFFCF9"
                strokeWidth={2}
              />
            ) : null}
            <Circle
              cx={selectedPos.x}
              cy={selectedPos.y}
              r={isToday ? 10 : 8}
              fill={isToday ? ROSE_DEEP : '#FFFCF9'}
              stroke={phaseContent?.color ?? ROSE}
              strokeWidth={isToday ? 3 : 3}
            />
          </G>
        </Svg>

        <View
          style={[
            styles.centerOverlay,
            {
              left: cx - innerR * 0.85,
              top: cy - innerR * 0.85,
              width: innerR * 1.7,
              height: innerR * 1.7,
            },
          ]}
          pointerEvents="none"
        >
          {isToday ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
            </View>
          ) : null}
          <Text style={styles.centerDate} numberOfLines={2}>
            {formatDateLabel(selectedDate)}
          </Text>
          <Text style={styles.centerDay}>Jour {selectedDay}</Text>
          <Text style={[styles.centerPhase, { color: phaseContent?.color ?? TEXT }]}>
            {phaseContent?.shortTitle ?? ''}
          </Text>
          <Text style={styles.centerCountdown}>{formatPeriodCountdown(daysUntilPeriod)}</Text>
        </View>
      </View>
      <Text style={styles.hint}>Fais glisser le point autour du cercle</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  wheelBox: { position: 'relative' },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    backgroundColor: ROSE_DEEP,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  todayBadgeText: { color: '#FFFCF9', fontSize: 10, fontWeight: '700' },
  centerDate: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    lineHeight: 17,
  },
  centerDay: { fontSize: 11, color: MUTED, marginTop: 2 },
  centerPhase: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  centerCountdown: { fontSize: 11, color: MUTED, marginTop: 4, textAlign: 'center' },
  hint: { fontSize: 11, color: MUTED, marginTop: 8, fontStyle: 'italic' },
});
