import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { MUTED, ROSE, TEXT } from '../constants/theme';
import type { PlantReaction } from '../constants/plantReactions';
import { todayKey } from '../lib/dates';
import {
  cycleConfigFromData,
  getPlantPhaseFromData,
  plantStatesEqual,
  type PlantPhaseState,
} from '../lib/plantPhase';
import {
  loadPlantCompanionState,
  savePlantCompanionState,
} from '../lib/plantCompanionStorage';
import {
  dismissFlowerBadge,
  ensureFlowerVariantForCycle,
  galleryAlbumSeason,
  loadPlantGallery,
  resolveDisplaySpecies,
  type FlowerVariante,
} from '../lib/plantRarity';
import type { FlowerSpeciesId } from '../constants/flowerSpecies';
import { RARITY_LABELS } from '../constants/flowerSpecies';
import type { AlbumSeasonId } from '../constants/albumSeason';
import { isHardDayEntry } from '../lib/cycleStats';
import { getPeriodOverdueDays, isPeriodDueOrLate } from '../lib/periodTiming';
import { countConsecutiveLoggedDays } from '../lib/plantReactionDetect';
import { pickPlantWhisper } from '../lib/plantWhisper';
import { isEmptyDayEntry } from '../lib/cycleInsights';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import {
  PlantCompanion,
  PLANT_PHASE_LABELS,
  PLANT_STAGE_PREVIEWS,
} from './PlantCompanion';

const TRANSITION_MS = 2500;
const TICK_MS = 40;
const WHISPER_MS = 7000;

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
  reactionTrigger?: PlantReaction | null;
  onReactionDone?: () => void;
  onStartPeriodSetup?: () => void;
};

export function PlantCompanionCard({
  data,
  userId,
  reactionTrigger = null,
  onReactionDone,
  onStartPeriodSetup,
}: PlantCompanionCardProps) {
  const target = useMemo(() => getPlantPhaseFromData(data, todayKey()), [data]);
  const targetKey = target ? `${target.phase}:${target.progression.toFixed(3)}` : 'none';
  const cycleStart = useMemo(
    () => cycleConfigFromData(data, todayKey())?.dateDebutDernieresRegles ?? null,
    [data],
  );
  const { setPhase, accent } = usePhaseAccent();
  const [display, setDisplay] = useState<PlantPhaseState | null>(target);
  const [showPreview, setShowPreview] = useState(__DEV__);
  const [variante, setVariante] = useState<FlowerVariante>('commune');
  const [speciesId, setSpeciesId] = useState<FlowerSpeciesId>('capucine');
  const [flowerName, setFlowerName] = useState('Capucine');
  const [isSignature, setIsSignature] = useState(false);
  const [seasonId, setSeasonId] = useState<AlbumSeasonId>('printemps');
  const [showRarityBadge, setShowRarityBadge] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whisperTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTargetKey = useRef<string | null>(null);

  const today = todayKey();
  const periodLate = useMemo(
    () => Boolean(target && isPeriodDueOrLate(data, today)),
    [data, target, today],
  );
  const overdueDays = useMemo(
    () => (periodLate ? getPeriodOverdueDays(data, today) : 0),
    [periodLate, data, today],
  );
  const todayEntry = data[today];
  const hardDay = isHardDayEntry(todayEntry);
  const streak = useMemo(() => countConsecutiveLoggedDays(data, today), [data, today]);
  const loggedToday = Boolean(todayEntry && !isEmptyDayEntry(todayEntry));

  useEffect(() => {
    return () => {
      if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current);
    };
  }, []);

  const revealWhisper = useCallback(() => {
    if (!display) return;
    const text = pickPlantWhisper({
      phase: display.phase,
      dateKey: today,
      hardDay,
      streak: loggedToday ? streak : 0,
    });
    setWhisper(text);
    if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current);
    whisperTimerRef.current = setTimeout(() => setWhisper(null), WHISPER_MS);
  }, [display, today, hardDay, streak, loggedToday]);

  useEffect(() => {
    setPhase(target?.phase ?? null);
  }, [target?.phase, setPhase]);

  useEffect(() => {
    if (!userId || !target || !cycleStart) {
      setVariante('commune');
      setSpeciesId('capucine');
      setFlowerName('Capucine');
      setIsSignature(false);
      setSeasonId('printemps');
      setShowRarityBadge(false);
      return;
    }
    let cancelled = false;
    (async () => {
      await ensureFlowerVariantForCycle(
        userId,
        cycleStart,
        target.phase,
        target.progression,
      );
      const gallery = await loadPlantGallery(userId);
      if (cancelled) return;
      const display = resolveDisplaySpecies(gallery, cycleStart);
      const season = galleryAlbumSeason(gallery);
      setVariante(display.variante);
      setSpeciesId(display.speciesId);
      setFlowerName(display.name);
      setIsSignature(display.isSignature);
      setSeasonId(season.id);
      const record = gallery.byCycle[cycleStart];
      const inBloom =
        target.phase === 'ovulatoire' || target.phase === 'luteale';
      setShowRarityBadge(
        Boolean(record && !record.badgeDismissed && inBloom),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, cycleStart, target?.phase, target?.progression, target]);

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

  const handleDismissBadge = useCallback(async () => {
    setShowRarityBadge(false);
    if (userId && cycleStart) {
      await dismissFlowerBadge(userId, cycleStart);
    }
  }, [userId, cycleStart]);

  if (!target || !display) {
    return (
      <View style={styles.card} accessibilityRole="summary">
        <View style={styles.emptyRow}>
          <PlantCompanion phase="folliculaire" progression={0.35} size={88} variante="commune" />
          <View style={styles.copy}>
            <Text style={styles.emptyTitle}>Ton compagnon plante</Text>
            <Text style={styles.emptyText}>
              Enregistre un jour de règles pour voir ta plante évoluer avec ton cycle.
            </Text>
            {onStartPeriodSetup ? (
              <Pressable
                onPress={onStartPeriodSetup}
                style={styles.emptyCta}
                accessibilityRole="button"
                accessibilityLabel="Choisir la date des dernières règles"
              >
                <Text style={styles.emptyCtaText}>Choisir la date</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {__DEV__ ? (
          <Pressable onPress={() => setShowPreview((s) => !s)} style={styles.previewToggle}>
            <Text style={styles.previewToggleText}>
              {showPreview ? 'Masquer' : 'Voir'} l’aperçu des stades
            </Text>
          </Pressable>
        ) : null}
        {showPreview ? <PlantStagePreviewStrip /> : null}
      </View>
    );
  }

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '66' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Compagnon plante, ${PLANT_PHASE_LABELS[display.phase as CyclePhaseId]}`}
    >
      <Pressable
        style={styles.row}
        onPress={revealWhisper}
        accessibilityRole="button"
        accessibilityLabel="Écouter un murmure de la plante"
        accessibilityHint="Affiche une courte phrase du compagnon"
      >
        <PlantCompanion
          phase={display.phase}
          progression={display.progression}
          size={132}
          variante={variante}
          speciesId={speciesId}
          seasonId={seasonId}
          reaction={reactionTrigger}
          onReactionDone={onReactionDone}
        />
        <View style={styles.copy}>
          <Text style={styles.kicker}>Compagnon</Text>
          <Text style={[styles.title, { color: accent.accent }]}>
            {PLANT_PHASE_LABELS[display.phase as CyclePhaseId]}
          </Text>
          <Text style={styles.meta}>
            Progression {Math.round(display.progression * 100)} %
            {` · ${flowerName}`}
            {isSignature && !showRarityBadge ? ' · signature' : ''}
          </Text>
          <Text style={styles.tapHint}>Touche la plante pour un murmure</Text>
          {hardDay ? (
            <Text style={[styles.presence, { color: accent.accent }]}>Je suis là.</Text>
          ) : null}
          {periodLate ? (
            <View style={[styles.lateChip, { borderColor: accent.accent + '55' }]}>
              <Text style={[styles.lateChipText, { color: accent.accent }]}>
                {overdueDays > 0
                  ? `Règles en retard · ${overdueDays} j`
                  : 'Règles attendues aujourd’hui'}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      {showRarityBadge ? (
        <Pressable
          onPress={handleDismissBadge}
          style={[styles.badge, { borderColor: accent.highlight + '88' }]}
          accessibilityRole="button"
          accessibilityLabel={`Floraison de ce cycle : ${flowerName}`}
        >
          <Text style={[styles.badgeText, { color: accent.accent }]}>
            Floraison : {flowerName}
          </Text>
          <Text style={styles.badgeHint}>
            {RARITY_LABELS[variante]} — touché pour fermer · voir la collection dans Insights
          </Text>
        </Pressable>
      ) : null}

      {whisper && !reactionTrigger?.message ? (
        <Text
          style={[styles.whisperText, { color: accent.accent }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          {whisper}
        </Text>
      ) : null}

      {reactionTrigger?.message ? (
        <Text
          style={[styles.reactionText, { color: accent.accent }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          {reactionTrigger.message}
        </Text>
      ) : null}

      {__DEV__ ? (
        <Pressable onPress={() => setShowPreview((s) => !s)} style={styles.previewToggle}>
          <Text style={styles.previewToggleText}>
            {showPreview ? 'Masquer' : 'Voir'} l’aperçu des stades
          </Text>
        </Pressable>
      ) : null}
      {showPreview ? <PlantStagePreviewStrip /> : null}
    </View>
  );
}

function PlantStagePreviewStrip() {
  return (
    <View style={styles.previewBlock}>
      <Text style={styles.previewTitle}>Aperçu des stades</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
        {PLANT_STAGE_PREVIEWS.map((stage) => (
          <View key={`${stage.phase}-${stage.progression}`} style={styles.previewItem}>
            <PlantCompanion
              phase={stage.phase}
              progression={stage.progression}
              size={88}
              variante="commune"
            />
            <Text style={styles.previewLabel}>{stage.label}</Text>
            <Text style={styles.previewMeta}>{Math.round(stage.progression * 100)} %</Text>
          </View>
        ))}
      </ScrollView>
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
  tapHint: { fontSize: 11, color: MUTED, marginTop: 6, fontStyle: 'italic' },
  presence: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  lateChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: ROSE + '14',
  },
  lateChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, lineHeight: 19 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emptyCta: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: ROSE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#FFFCF9', fontWeight: '700', fontSize: 13 },
  badge: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFF8F2',
  },
  badgeText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  badgeHint: { fontSize: 11, color: MUTED, marginTop: 4 },
  whisperText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  reactionText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  previewToggle: { marginTop: 12, alignSelf: 'flex-start' },
  previewToggleText: { fontSize: 12, color: MUTED, fontWeight: '600' },
  previewBlock: { marginTop: 12 },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewRow: { gap: 10, paddingRight: 8 },
  previewItem: { alignItems: 'center', width: 96 },
  previewLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
  },
  previewMeta: { fontSize: 10, color: MUTED, marginTop: 2 },
});
