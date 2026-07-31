import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { CyclePhaseId } from '../types/cycle';
import { PHASE_ACCENTS } from '../constants/phaseAccent';
import type { PlantReaction } from '../constants/plantReactions';
import type { FlowerVariante } from '../lib/plantRarity';
import { BORDER } from '../constants/theme';

export type PlantCompanionProps = {
  phase: CyclePhaseId;
  progression: number;
  size?: number;
  variante?: FlowerVariante;
  reaction?: PlantReaction | null;
  onReactionDone?: () => void;
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
  variante: FlowerVariante = 'commune',
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

  let visuals: VisualParams;

  switch (phase) {
    case 'menstruelle':
      visuals = {
        ...base,
        stemHeight: 0.14 + p * 0.08,
        stemColor: accents.accent,
        leafColor: accents.highlight,
      };
      break;
    case 'folliculaire':
      visuals = {
        ...base,
        stemHeight: 0.22 + p * 0.72,
        leafOpacity: p >= 0.28 ? clamp01((p - 0.28) / 0.72) : 0,
        flowerScale: p >= 0.85 ? ((p - 0.85) / 0.15) * 0.25 : 0,
        flowerOpacity: p >= 0.85 ? ((p - 0.85) / 0.15) * 0.4 : 0,
        stemColor: accents.accent,
        leafColor: accents.highlight,
        petalColor: PHASE_ACCENTS.ovulatoire.accent,
      };
      break;
    case 'ovulatoire':
      visuals = {
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
      break;
    case 'luteale': {
      const fruitGrow = clamp01(p / 0.45);
      const petalFall = clamp01((p - 0.45) / 0.55);
      visuals = {
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
      break;
    }
    default:
      visuals = base;
  }

  if (variante === 'rare') {
    return {
      ...visuals,
      petalColor: PHASE_ACCENTS.ovulatoire.highlight,
      centerColor: PHASE_ACCENTS.ovulatoire.accent,
    };
  }
  if (variante === 'tres_rare') {
    return {
      ...visuals,
      petalColor: '#9B6B9E',
      centerColor: '#E8C547',
      fruitColor: '#9B6B9E',
    };
  }
  return visuals;
}

function Petal({
  cx,
  cy,
  angleDeg,
  scale,
  opacity,
  droop,
  color,
  elongated,
}: {
  cx: number;
  cy: number;
  angleDeg: number;
  scale: number;
  opacity: number;
  droop: number;
  color: string;
  elongated?: boolean;
}) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const len = (elongated ? 26 : 22) * scale;
  const width = (elongated ? 5.5 : 7) * scale;
  const droopY = droop * 10;
  const x2 = cx + Math.cos(rad) * len;
  const y2 = cy + Math.sin(rad) * len + droopY;
  const mx = cx + Math.cos(rad) * len * 0.55 + Math.cos(rad + Math.PI / 2) * width;
  const my =
    cy + Math.sin(rad) * len * 0.55 + Math.sin(rad + Math.PI / 2) * width + droopY * 0.5;
  const nx = cx + Math.cos(rad) * len * 0.55 - Math.cos(rad + Math.PI / 2) * width;
  const ny =
    cy + Math.sin(rad) * len * 0.55 - Math.sin(rad + Math.PI / 2) * width + droopY * 0.5;
  const d = `M ${cx} ${cy} Q ${mx} ${my} ${x2} ${y2} Q ${nx} ${ny} ${cx} ${cy}`;
  return <Path d={d} fill={color} opacity={opacity} />;
}

const PETAL_ANGLES_COMMUNE = [0, 72, 144, 216, 288];
const PETAL_ANGLES_RARE = [0, 60, 120, 180, 240, 300];
const PETAL_ANGLES_TRES_RARE = [0, 45, 90, 135, 180, 225, 270, 315];

export function PlantCompanion({
  phase,
  progression,
  size = 160,
  variante = 'commune',
  reaction = null,
  onReactionDone,
}: PlantCompanionProps) {
  const v = useMemo(
    () => computePlantVisuals(phase, progression, variante),
    [phase, progression, variante],
  );

  const bounceY = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const lastReactionId = useRef<string | null>(null);

  useEffect(() => {
    if (!reaction) {
      lastReactionId.current = null;
      return;
    }
    if (reaction.id === lastReactionId.current) return;
    lastReactionId.current = reaction.id;
    const { dy, scale, durationMs } = reaction.motion;
    const easing = reaction.soft
      ? Easing.inOut(Easing.sin)
      : Easing.out(Easing.back(1.4));
    bounceY.setValue(0);
    bounceScale.setValue(1);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(bounceY, {
          toValue: dy,
          duration: durationMs * 0.45,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(bounceScale, {
          toValue: scale,
          duration: durationMs * 0.45,
          easing,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(bounceY, {
          toValue: 0,
          duration: durationMs * 0.55,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceScale, {
          toValue: 1,
          duration: durationMs * 0.55,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onReactionDone?.();
    });
  }, [reaction, bounceY, bounceScale, onReactionDone]);

  const vb = 120;
  const soilY = 98;
  const stemBaseX = 60;
  const stemBaseY = soilY - 6;
  const stemTopY = stemBaseY - v.stemHeight * 58;
  const flowerCy = stemTopY;
  const flowerCx = stemBaseX;

  const petalAngles =
    variante === 'tres_rare'
      ? PETAL_ANGLES_TRES_RARE
      : variante === 'rare'
        ? PETAL_ANGLES_RARE
        : PETAL_ANGLES_COMMUNE;

  const phaseTint = PHASE_ACCENTS[phase].highlight + '33';

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width: size, height: size, backgroundColor: phaseTint },
        { transform: [{ translateY: bounceY }, { scale: bounceScale }] },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Compagnon plante, phase ${phase}${variante !== 'commune' ? `, variante ${variante}` : ''}, progression ${Math.round(progression * 100)} pourcent`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
        {/* Pot — proportions un peu plus larges / stables */}
        <Path
          d="M36 95 L41 113 Q60 118 79 113 L84 95 Z"
          fill="#C4B5A8"
          stroke="#A89888"
          strokeWidth={1}
        />
        <Ellipse cx={60} cy={95} rx={26} ry={5.5} fill="#D4C4B4" />
        <Ellipse cx={60} cy={95} rx={21} ry={3.8} fill="#8B7355" opacity={0.55} />

        {/* Stem */}
        <Path
          d={`M ${stemBaseX} ${stemBaseY} Q ${stemBaseX - 2.5} ${(stemBaseY + stemTopY) / 2} ${stemBaseX} ${stemTopY}`}
          stroke={v.stemColor}
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
        />

        {v.leafOpacity > 0.01 ? (
          <G opacity={v.leafOpacity}>
            <G transform={`rotate(-38 ${stemBaseX - 15} ${stemBaseY - v.stemHeight * 28})`}>
              <Ellipse
                cx={stemBaseX - 15}
                cy={stemBaseY - v.stemHeight * 28}
                rx={12}
                ry={5.2}
                fill={v.leafColor}
              />
            </G>
            <G transform={`rotate(34 ${stemBaseX + 15} ${stemBaseY - v.stemHeight * 38})`}>
              <Ellipse
                cx={stemBaseX + 15}
                cy={stemBaseY - v.stemHeight * 38}
                rx={11}
                ry={4.8}
                fill={v.leafColor}
              />
            </G>
            {variante !== 'commune' ? (
              <G transform={`rotate(-18 ${stemBaseX - 8} ${stemBaseY - v.stemHeight * 48})`}>
                <Ellipse
                  cx={stemBaseX - 8}
                  cy={stemBaseY - v.stemHeight * 48}
                  rx={7}
                  ry={3.2}
                  fill={v.leafColor}
                  opacity={0.85}
                />
              </G>
            ) : null}
          </G>
        ) : null}

        {v.flowerOpacity > 0.02 && v.flowerScale > 0.05 ? (
          <G>
            {petalAngles.map((angle) => (
              <Petal
                key={angle}
                cx={flowerCx}
                cy={flowerCy}
                angleDeg={angle}
                scale={v.flowerScale * (variante === 'tres_rare' ? 0.92 : 1)}
                opacity={v.flowerOpacity * 0.92}
                droop={v.petalDroop}
                color={v.petalColor}
                elongated={variante === 'rare'}
              />
            ))}
            <Circle
              cx={flowerCx}
              cy={flowerCy + v.petalDroop * 4}
              r={(variante === 'tres_rare' ? 5.2 : 4.5) * v.flowerScale}
              fill={v.centerColor}
              opacity={v.flowerOpacity}
            />
            {variante === 'tres_rare' ? (
              <G opacity={v.flowerOpacity * 0.85}>
                {[
                  [flowerCx - 14, flowerCy - 10],
                  [flowerCx + 16, flowerCy - 6],
                  [flowerCx + 4, flowerCy - 16],
                ].map(([x, y], i) => (
                  <Circle key={i} cx={x} cy={y} r={1.4} fill={v.centerColor} />
                ))}
              </G>
            ) : null}
          </G>
        ) : null}

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

        {v.stemHeight > 0.25 && v.flowerScale < 0.08 ? (
          <Ellipse
            cx={flowerCx}
            cy={flowerCy}
            rx={3.2}
            ry={4.2}
            fill={v.stemColor}
            opacity={0.75}
          />
        ) : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
});

export const PLANT_PHASE_LABELS: Record<CyclePhaseId, string> = {
  menstruelle: 'Graine — repos',
  folliculaire: 'Pousse — énergie',
  ovulatoire: 'Floraison',
  luteale: 'Fruits — transition',
};

/** Stades pour le mode preview (couche 2). */
export const PLANT_STAGE_PREVIEWS: {
  phase: CyclePhaseId;
  progression: number;
  label: string;
}[] = [
  { phase: 'menstruelle', progression: 0.5, label: 'Menstruelle' },
  { phase: 'folliculaire', progression: 0.7, label: 'Folliculaire' },
  { phase: 'ovulatoire', progression: 0.5, label: 'Ovulatoire' },
  { phase: 'luteale', progression: 0.25, label: 'Lutéale début' },
  { phase: 'luteale', progression: 0.85, label: 'Lutéale fin' },
];
