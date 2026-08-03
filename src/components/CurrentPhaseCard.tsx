import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatPhaseHero, getPhaseById } from '../constants/cycleContent';
import { BG_SOFT, BORDER, MUTED, ROSE, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { todayKey } from '../lib/dates';
import { getCycleContextForDate } from '../lib/cyclePhase';
import type { CycleData } from '../types/cycle';

type CurrentPhaseCardProps = {
  data: CycleData;
  onStartPeriodSetup?: () => void;
};

/** Carte Suivi : phase du jour (titre, ligne courte, jour du cycle). */
export function CurrentPhaseCard({ data }: CurrentPhaseCardProps) {
  const { setPhase } = usePhaseAccent();
  const context = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  useEffect(() => {
    setPhase(context?.phase ?? null);
  }, [context?.phase, setPhase]);

  if (!context) {
    return (
      <View style={styles.card} accessibilityRole="summary">
        <Text style={styles.title}>Ta phase actuelle</Text>
        <Text style={styles.body}>Enregistre tes règles pour voir ta phase</Text>
      </View>
    );
  }

  const phase = getPhaseById(context.phase);
  const hero = formatPhaseHero(phase);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={[styles.eyebrow, { color: ROSE }]}>Aujourd’hui</Text>
      <Text style={styles.title}>{phase.shortTitle}</Text>
      <Text style={styles.body} numberOfLines={3}>
        {hero.subtitle}
      </Text>
      <Text style={styles.day}>Jour {context.cycleDay} du cycle</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  day: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
});
