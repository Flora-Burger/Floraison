import { StyleSheet, Text, View } from 'react-native';
import { Sparkle } from 'phosphor-react-native';
import type { CyclePhaseId } from '../types/cycle';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { useDailyMessage } from '../hooks/useDailyMessage';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';

type DailyMessageCardProps = {
  phase: CyclePhaseId | null | undefined;
  userId?: string;
  date: string;
};

const TONE_LABELS = {
  narratif: 'Ton compagnon',
  scientifique: 'À savoir',
} as const;

export function DailyMessageCard({ phase, userId, date }: DailyMessageCardProps) {
  const { accent } = usePhaseAccent();
  const message = useDailyMessage(phase, userId, date);

  if (!phase || !message) return null;

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
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT,
    fontWeight: '500',
  },
});
