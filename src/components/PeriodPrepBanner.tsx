import { StyleSheet, Text, View } from 'react-native';
import { Drop } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { todayKey } from '../lib/dates';
import { getPeriodPrepState } from '../lib/cycleStats';
import { BG_SOFT, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type PeriodPrepBannerProps = {
  data: CycleData;
};

/** Bannière douce 0–3 j avant la date prévue des règles. */
export function PeriodPrepBanner({ data }: PeriodPrepBannerProps) {
  const prep = getPeriodPrepState(data, todayKey(), 3);
  if (!prep?.active) return null;

  const body =
    prep.daysUntil === 0
      ? 'Tes règles pourraient commencer aujourd’hui — note-les si elles arrivent.'
      : prep.daysUntil === 1
        ? 'Tes règles pourraient commencer demain — un petit log suffit si tu les sens venir.'
        : `Fenêtre proche : environ ${prep.daysUntil} jours avant la date prévue. Prépare-toi sans stress.`;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={body}
    >
      <Drop size={18} weight="duotone" color={ROSE} />
      <View style={styles.copy}>
        <Text style={styles.title}>Préparation règles</Text>
        <Text style={styles.body}>{body}</Text>
        <Text style={styles.hint}>Rien d’obligatoire — juste un rappel doux.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  copy: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
  hint: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
  },
});
