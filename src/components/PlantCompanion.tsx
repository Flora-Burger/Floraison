import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { CyclePhaseId } from '../types/cycle';
import { PHASE_ACCENTS } from '../constants/phaseAccent';
import { BG_SOFT, BORDER } from '../constants/theme';

export type PlantCompanionProps = {
  phase: CyclePhaseId;
  progression: number;
  size?: number;
};

type VisualParams = {
  stemHeight: number;
  leafOpacity: number;
  flowerScale: number;
  flowerOpacity: number;
  petalDroop: number;
  fruitScale: number;
  stemColor: string;
  leafColor: string;
  petalColor: string;
  fruitColor: string;
  centerColor: string;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function computePlantVisuals(
  phase: CyclePhaseId,
  progression: number,
): VisualParams {
  const p = clamp01(progression);
  const accents = PHASE_ACCENTS[phase];

  const base: VisualParams = {
    stemHeight: 0.15,
    leafOpacity: 0,
    flowerScale: 0,
    flowerOpacity: 0,
    petalDroop: 0,
    fruitScale: 0,
    stemColor: accents.accent,
    leafColor: accents.highlight,
    petalColor: accents.accent,
    fruitColor: accents.highlight,
    centerColor: accents.highlight,
  };

  switch (phase) {
    case 'menstruelle':
      return {
        ...base,
        stemHeight: 0.12 + p * 0.06,
        stemColor: accents.accent,
        leafColor: accents.highlight,
      };
    case 'folliculaire':
      return {
        ...base,
        stemHeight: 0.2 + p * 0.75,
        leafOpacity: p >= 0.3 ? clamp01((p - 0.3) / 0.7) : 0,
        flowerScale: p >= 0.85 ? (p - 0.85) / 0.15 * 0.25 : 0,
        flowerOpacity: p >= 0.85 ? (p - 0.85) / 0.15 * 0.4 : 0,
        stemColor: accents.accent,
        leafColor: accents.highlight,
        petalColor: PHASE_ACCENTS.ovulatoire.accent,
      };
    case 'ovulatoire':
      return {
        ...base,
        stemHeight: 0.95,
        leafOpacity: 1,
        flowerScale: 0.35 + p * 0.65,
        flowerOpacity: 0.45 + p * 0.55,
        stemColor: PHASE_ACCENTS.folliculaire.accent,
        leafColor: PHASE_ACCENTS.folliculaire.highlight,
        petalColor: accents.accent,
        centerColor: accents.highlight,
      };
    case 'luteale': {
      const fruitGrow = clamp01(p / 0.45);
      const petalFall = clamp01((p - 0.45) / 0.55);
      return {
        ...base,
        stemHeight: 0.92,
        leafOpacity: 1 - petalFall * 0.35,
        flowerScale: 1 - petalFall * 0.55,
        flowerOpacity: 1 - petalFall * 0.85,
        petalDroop: petalFall,
        fruitScale: fruitGrow * (1 - petalFall * 0.15),
        stemColor: PHASE_ACCENTS.folliculaire.accent,
        leafColor: PHASE_ACCENTS.folliculaire.highlight,
        petalColor: PHASE_ACCENTS.ovulatoire.accent,
        fruitColor: accents.accent,
        centerColor: accents.highlight,
      };
    }
    default:
      return base;
  }
}

function Petal({
  cx,
  cy,
  angleDeg,
  scale,
  opacity,
  droop,
  color,
}: {
  cx: number;
  cy: number;
  angleDeg: number;
  scale: number;
  opacity: number;
  droop: number;
  color: string;
}) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const len = 22 * scale;
  const droopY = droop * 10;
  const x2 = cx + Math.cos(rad) * len;
  const y2 = cy + Math.sin(rad) * len + droopY;
  const mx = cx + Math.cos(rad) * len * 0.55 + Math.cos(rad + Math.PI / 2) * 7 * scale;
  const my = cy + Math.sin(rad) * len * 0.55 + Math.sin(rad + Math.PI / 2) * 7 * scale + droopY * 0.5;
  const nx = cx + Math.cos(rad) * len * 0.55 - Math.cos(rad + Math.PI / 2) * 7 * scale;
  const ny = cy + Math.sin(rad) * len * 0.55 - Math.sin(rad + Math.PI / 2) * 7 * scale + droopY * 0.5;
  const d = `M ${cx} ${cy} Q ${mx} ${my} ${x2} ${y2} Q ${nx} ${ny} ${cx} ${cy}`;
  return <Path d={d} fill={color} opacity={opacity} />;
}

export function PlantCompanion({ phase, progression, size = 160 }: PlantCompanionProps) {
  const v = useMemo(() => computePlantVisuals(phase, progression), [phase, progression]);

  const vb = 120;
  const soilY = 98;
  const stemBaseX = 60;
  const stemBaseY = soilY - 6;
  const stemTopY = stemBaseY - v.stemHeight * 58;
  const flowerCy = stemTopY;
  const flowerCx = stemBaseX;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityLabel={`Plante ${phase}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        {/* Pot */}
        <Path
          d="M38 96 L42 114 Q60 118 78 114 L82 96 Z"
          fill="#C4B5A8"
          stroke="#A89888"
          strokeWidth={1}
        />
        <Ellipse cx={60} cy={96} rx={24} ry={5} fill="#D4C4B4" />
        <Ellipse cx={60} cy={96} rx={20} ry={3.5} fill="#8B7355" opacity={0.55} />

        {/* Stem */}
        <Path
          d={`M ${stemBaseX} ${stemBaseY} Q ${stemBaseX - 2} ${(stemBaseY + stemTopY) / 2} ${stemBaseX} ${stemTopY}`}
          stroke={v.stemColor}
          strokeWidth={3.2}
          fill="none"
          strokeLinecap="round"
        />

        {/* Leaves (after 30% follicular+) */}
        {v.leafOpacity > 0.01 ? (
          <G opacity={v.leafOpacity}>
            <G
              transform={`rotate(-35 ${stemBaseX - 14} ${stemBaseY - v.stemHeight * 28})`}
            >
              <Ellipse
                cx={stemBaseX - 14}
                cy={stemBaseY - v.stemHeight * 28}
                rx={11}
                ry={5}
                fill={v.leafColor}
              />
            </G>
            <G
              transform={`rotate(32 ${stemBaseX + 14} ${stemBaseY - v.stemHeight * 36})`}
            >
              <Ellipse
                cx={stemBaseX + 14}
                cy={stemBaseY - v.stemHeight * 36}
                rx={10}
                ry={4.5}
                fill={v.leafColor}
              />
            </G>
          </G>
        ) : null}

        {/* Flower petals */}
        {v.flowerOpacity > 0.02 && v.flowerScale > 0.05 ? (
          <G>
            {[0, 72, 144, 216, 288].map((angle) => (
              <Petal
                key={angle}
                cx={flowerCx}
                cy={flowerCy}
                angleDeg={angle}
                scale={v.flowerScale}
                opacity={v.flowerOpacity * 0.92}
                droop={v.petalDroop}
                color={v.petalColor}
              />
            ))}
            <Circle
              cx={flowerCx}
              cy={flowerCy + v.petalDroop * 4}
              r={4.5 * v.flowerScale}
              fill={v.centerColor}
              opacity={v.flowerOpacity}
            />
          </G>
        ) : null}

        {/* Fruits (luteal) */}
        {v.fruitScale > 0.05 ? (
          <G>
            <Circle
              cx={flowerCx - 10}
              cy={flowerCy + 8}
              r={3.5 * v.fruitScale}
              fill={v.fruitColor}
              opacity={0.95}
            />
            <Circle
              cx={flowerCx + 11}
              cy={flowerCy + 6}
              r={4 * v.fruitScale}
              fill={v.fruitColor}
              opacity={0.9}
            />
            <Circle
              cx={flowerCx + 2}
              cy={flowerCy + 14}
              r={3 * v.fruitScale}
              fill={v.fruitColor}
              opacity={0.85}
            />
          </G>
        ) : null}

        {/* Quiet bud when stem exists but no flower yet */}
        {v.stemHeight > 0.25 && v.flowerScale < 0.08 ? (
          <Ellipse
            cx={flowerCx}
            cy={flowerCy}
            rx={3}
            ry={4}
            fill={v.stemColor}
            opacity={0.75}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_SOFT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
});

export const PLANT_PHASE_LABELS: Record<CyclePhaseId, string> = {
  menstruelle: 'Repos — repos',
  folliculaire: 'Pousse — énergie',
  ovulatoire: 'Floraison',
  luteale: 'Fruits — transition',
};
