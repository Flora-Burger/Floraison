import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { MUTED, TEXT } from '../constants/theme';
import { todayKey } from '../lib/dates';
import {
  getPlantPhaseFromData,
  plantStatesEqual,
  type PlantPhaseState,
} from '../lib/plantPhase';
import {
  loadPlantCompanionState,
  savePlantCompanionState,
} from '../lib/plantCompanionStorage';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { PlantCompanion, PLANT_PHASE_LABELS } from './PlantCompanion';

const TRANSITION_MS = 2500;
const TICK_MS = 40;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function blendStates(
  from: PlantPhaseState,
  to: PlantPhaseState,
  tRaw: number,
): PlantPhaseState {
  const t = easeInOut(Math.min(1, Math.max(0, tRaw)));
  if (from.phase === to.phase) {
    return { phase: to.phase, progression: lerp(from.progression, to.progression, t) };
  }
  if (t < 0.5) {
    const u = t * 2;
    return { phase: from.phase, progression: lerp(from.progression, 1, u) };
  }
  const u = (t - 0.5) * 2;
  return { phase: to.phase, progression: lerp(0, to.progression, u) };
}

type PlantCompanionCardProps = {
  data: CycleData;
  userId?: string;
};

export function PlantCompanionCard({ data, userId }: PlantCompanionCardProps) {
  const target = useMemo(() => getPlantPhaseFromData(data, todayKey()), [data]);
  const targetKey = target ? `${target.phase}:${target.progression.toFixed(3)}` : 'none';
  const { setPhase, accent } = usePhaseAccent();
  const [display, setDisplay] = useState<PlantPhaseState | null>(target);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTargetKey = useRef<string | null>(null);

  useEffect(() => {
    setPhase(target?.phase ?? null);
  }, [target?.phase, setPhase]);

  useEffect(() => {
    if (!target) {
      setDisplay(null);
      lastTargetKey.current = null;
      return;
    }

    if (lastTargetKey.current === targetKey) {
      setDisplay(target);
      return;
    }

    let cancelled = false;

    (async () => {
      if (!userId) {
        setDisplay(target);
        lastTargetKey.current = targetKey;
        return;
      }

      const previous = await loadPlantCompanionState(userId);
      if (cancelled) return;

      lastTargetKey.current = targetKey;

      if (!previous || plantStatesEqual(previous, target)) {
        setDisplay(target);
        await savePlantCompanionState(userId, target);
        return;
      }

      setDisplay(previous);
      if (animRef.current) clearInterval(animRef.current);
      const started = Date.now();
      animRef.current = setInterval(() => {
        const elapsed = Date.now() - started;
        const t = Math.min(1, elapsed / TRANSITION_MS);
        setDisplay(blendStates(previous, target, t));
        if (t >= 1) {
          if (animRef.current) clearInterval(animRef.current);
          animRef.current = null;
          setDisplay(target);
          void savePlantCompanionState(userId, target);
        }
      }, TICK_MS);
    })();

    return () => {
      cancelled = true;
      if (animRef.current) {
        clearInterval(animRef.current);
        animRef.current = null;
      }
    };
  }, [userId, targetKey, target]);

  if (!target || !display) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyTitle}>Ton compagnon plante</Text>
        <Text style={styles.emptyText}>
          Enregistre un jour de règles pour voir ta plante évoluer avec ton cycle.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: accent.accent + '66' }]}>
      <View style={styles.row}>
        <PlantCompanion phase={display.phase} progression={display.progression} size={132} />
        <View style={styles.copy}>
          <Text style={styles.kicker}>Compagnon</Text>
          <Text style={[styles.title, { color: accent.accent }]}>
            {PLANT_PHASE_LABELS[display.phase as CyclePhaseId]}
          </Text>
          <Text style={styles.meta}>
            Progression {Math.round(display.progression * 100)} %
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#E8DFD6',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  copy: { flex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '700', color: TEXT, marginBottom: 4 },
  meta: { fontSize: 13, color: MUTED },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, lineHeight: 19 },
});
