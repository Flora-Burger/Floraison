import { StyleSheet, Text, View } from 'react-native';
import { Sparkle } from 'phosphor-react-native';
import type { CycleData, CyclePhaseId } from '../types/cycle';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { useDailyMessage } from '../hooks/useDailyMessage';
import { getPeriodOverdueDays, isPeriodDueOrLate } from '../lib/periodTiming';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';

type DailyMessageCardProps = {
  phase: CyclePhaseId | null | undefined;
  data: CycleData;
  userId?: string;
  date: string;
};

const TONE_LABELS = {
  narratif: 'Ton compagnon',
  scientifique: 'À savoir',
} as const;

export function DailyMessageCard({ phase, data, userId, date }: DailyMessageCardProps) {
  const { accent } = usePhaseAccent();
  const periodDueOrLate = phase === 'luteale' && isPeriodDueOrLate(data, date);
  const overdueDays = periodDueOrLate ? getPeriodOverdueDays(data, date) : 0;
  const messageContext = periodDueOrLate ? 'late_luteal' : 'default';
  const message = useDailyMessage(phase, userId, date, messageContext);

  if (!phase) {
    return (
      <View style={styles.card} accessibilityRole="text">
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: MUTED + '22' }]}>
            <Sparkle size={16} weight="duotone" color={MUTED} />
          </View>
          <View>
            <Text style={styles.kicker}>Aujourd’hui</Text>
            <Text style={[styles.tone, { color: MUTED }]}>Ton compagnon</Text>
          </View>
        </View>
        <Text style={styles.bodyMuted}>
          Enregistre un jour de règles pour recevoir un message adapté à ta phase.
        </Text>
      </View>
    );
  }

  if (!message) return null;

  const timingHint =
    periodDueOrLate
      ? overdueDays > 0
        ? `Règles attendues · ${overdueDays} jour${overdueDays > 1 ? 's' : ''} de retard — encore en lutéale`
        : 'Règles attendues aujourd’hui — encore en lutéale'
      : null;

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '55' }]}
      accessibilityRole="text"
      accessibilityLabel={`Message du jour : ${message.text}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accent.accent + '22' }]}>
          <Sparkle size={16} weight="duotone" color={accent.accent} />
        </View>
        <View>
          <Text style={styles.kicker}>Aujourd’hui</Text>
          <Text style={[styles.tone, { color: accent.accent }]}>
            {TONE_LABELS[message.tone]}
          </Text>
        </View>
      </View>
      {timingHint ? (
        <Text style={[styles.timingHint, { color: accent.highlight }]}>
          {timingHint}
        </Text>
      ) : null}
      <Text style={styles.body}>{message.text}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tone: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  timingHint: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 17,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    fontWeight: '500',
  },
  bodyMuted: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
  },
});
