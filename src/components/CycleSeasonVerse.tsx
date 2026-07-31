import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { isPeriodDueOrLate } from '../lib/periodTiming';
import { pickCycleSeasonVerse } from '../constants/cycleSeasonVerses';
import { pressVerseIntoHerbier } from '../lib/creativeStorage';
import { todayKey } from '../lib/dates';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';

type CycleSeasonVerseProps = {
  data: CycleData;
  phase?: CyclePhaseId | null;
  userId?: string;
  onPressed?: () => void;
};

/** Une ligne poétique — pressable dans l’herbier. */
export function CycleSeasonVerse({
  data,
  phase,
  userId,
  onPressed,
}: CycleSeasonVerseProps) {
  const { accent } = usePhaseAccent();
  const date = todayKey();
  const ctx = useMemo(() => getCycleContextForDate(data, date), [data, date]);
  const resolvedPhase = phase ?? ctx?.phase;
  const [status, setStatus] = useState<'idle' | 'added' | 'already'>('idle');

  const verse = useMemo(() => {
    if (!resolvedPhase) return null;
    const late = resolvedPhase === 'luteale' && isPeriodDueOrLate(data, date);
    return pickCycleSeasonVerse(resolvedPhase, date, { lateLuteal: late });
  }, [resolvedPhase, data, date]);

  if (!verse || !resolvedPhase) return null;

  const press = async () => {
    if (!userId) return;
    const result = await pressVerseIntoHerbier(userId, verse, resolvedPhase);
    setStatus(result.added ? 'added' : 'already');
    if (result.added) onPressed?.();
    setTimeout(() => setStatus('idle'), 1800);
  };

  return (
    <View
      style={[styles.wrap, { borderColor: accent.accent + '33' }]}
      accessibilityRole="text"
      accessibilityLabel={`Saison du cycle : ${verse}`}
    >
      <Text style={styles.kicker}>Saison</Text>
      <Text style={styles.verse}>{verse}</Text>
      {userId ? (
        <TouchableOpacity
          onPress={() => void press()}
          accessibilityRole="button"
          accessibilityLabel="Presser ce vers dans l’herbier"
          style={styles.pressBtn}
        >
          <Text style={[styles.pressText, { color: accent.accent }]}>
            {status === 'added'
              ? 'Pressé dans l’herbier'
              : status === 'already'
                ? 'Déjà dans l’herbier'
                : 'Presser dans l’herbier'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  verse: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '500',
    color: TEXT,
  },
  pressBtn: { marginTop: 8, alignSelf: 'flex-start' },
  pressText: { fontSize: 12, fontWeight: '700' },
});
