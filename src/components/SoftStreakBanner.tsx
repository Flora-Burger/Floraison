import { StyleSheet, Text, View } from 'react-native';
import type { CycleData } from '../types/cycle';
import { todayKey } from '../lib/dates';
import { countConsecutiveLoggedDays } from '../lib/plantReactionDetect';
import { BG_SOFT, BORDER, MUTED } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { useMemo } from 'react';

type SoftStreakBannerProps = {
  data: CycleData;
  /** Seuil d’affichage (défaut 3 — moins de bruit). */
  minStreak?: number;
};

/** Encouragement léger — pas de gamification agressive. */
export function SoftStreakBanner({ data, minStreak = 3 }: SoftStreakBannerProps) {
  const { accent } = usePhaseAccent();
  const streak = useMemo(
    () => countConsecutiveLoggedDays(data, todayKey()),
    [data],
  );

  if (streak < minStreak) return null;

  const message =
    streak < 7
      ? `${streak} jours d’affilée — ta plante te suit pas à pas`
      : `${streak} jours d’affilée — sans pression, juste le fil`;

  return (
    <View
      style={[styles.wrap, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel={`${message}. Un jour à la fois suffit.`}
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.label, { color: accent.accent }]}>{message}</Text>
      <Text style={styles.hint} importantForAccessibility="no">
        Un jour à la fois suffit.
      </Text>
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
  label: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  hint: { fontSize: 11, color: MUTED, marginTop: 2 },
});
