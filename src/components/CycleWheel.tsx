import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import type { CycleContext } from '../lib/cyclePhase';
import { CYCLE_PHASES } from '../constants/cycleContent';
import type { CyclePhaseId } from '../types/cycle';
import { TEXT, MUTED } from '../constants/theme';

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

type CycleWheelProps = {
  context: CycleContext;
  size?: number;
};

export function CycleWheel({ context, size = 220 }: CycleWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.55;
  const indicatorR = (outerR + innerR) / 2;

  const { cycleLength, cycleDay, segmentDays } = context;
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

  const indicatorAngle = ((cycleDay - 0.5) / cycleLength) * 360;
  const indicator = polarToCartesian(cx, cy, indicatorR, indicatorAngle);

  const phaseContent = CYCLE_PHASES.find((p) => p.id === context.phase);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <G>
          {segments.map((seg) => (
            <Path
              key={seg.phaseId}
              d={describeArc(cx, cy, outerR, seg.startAngle, seg.endAngle)}
              fill={seg.color}
              opacity={0.85}
            />
          ))}
          <Circle cx={cx} cy={cy} r={innerR} fill="#FFFCF9" />
          <Circle
            cx={indicator.x}
            cy={indicator.y}
            r={7}
            fill="#FFFCF9"
            stroke={phaseContent?.color ?? TEXT}
            strokeWidth={3}
          />
          <SvgText
            x={cx}
            y={cy - 6}
            fill={TEXT}
            fontSize={22}
            fontWeight="700"
            textAnchor="middle"
          >
            {`Jour ${cycleDay}`}
          </SvgText>
          <SvgText
            x={cx}
            y={cy + 16}
            fill={MUTED}
            fontSize={11}
            textAnchor="middle"
          >
            {phaseContent?.shortTitle ?? ''}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
});
