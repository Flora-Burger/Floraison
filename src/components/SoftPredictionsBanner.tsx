import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CycleData } from '../types/cycle';
import {
  predictionPauseReason,
  type PredictionPrefs,
} from '../lib/predictionPrefs';
import { getCycleRegularity } from '../lib/cycleMath';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';

type SoftPredictionsBannerProps = {
  data: CycleData;
  prefs: PredictionPrefs;
  onResume: () => void;
};

export function SoftPredictionsBanner({
  data,
  prefs,
  onResume,
}: SoftPredictionsBannerProps) {
  const { accent } = usePhaseAccent();
  const reason = predictionPauseReason(data, prefs);
  const regularity = getCycleRegularity(data);

  // Plus de bannière « légèrement variable » — trop de bruit sur Suivi
  if (!reason) return null;

  if (prefs.pausePredictions) {
    return (
      <View
        style={[styles.wrap, { borderColor: accent.accent + '55' }]}
        accessibilityRole="summary"
        accessibilityLabel="Prédictions en pause. Le calendrier se concentre sur ce que tu notes."
      >
        <Text style={[styles.title, { color: accent.accent }]} accessibilityRole="header">
          Prédictions en pause
        </Text>
        <Text style={styles.text}>
          Voyage, stress, cycle irrégulier… le calendrier se concentre sur ce que tu notes.
        </Text>
        <TouchableOpacity
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel="Réactiver les prédictions du calendrier"
        >
          <Text style={[styles.link, { color: accent.accent }]}>Réactiver les prédictions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, { borderColor: accent.accent + '55' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Prédictions en mode doux. Cycles de ${regularity.minGap} à ${regularity.maxGap} jours.`}
    >
      <Text style={[styles.title, { color: accent.accent }]} accessibilityRole="header">
        Prédictions en mode doux
      </Text>
      <Text style={styles.text}>
        Tes cycles varient beaucoup ({regularity.minGap}–{regularity.maxGap} j). Le calendrier
        n’affiche plus de jours « prévus » — note tes règles quand elles arrivent.
      </Text>
      <Text style={styles.hint}>
        Tu peux aussi forcer la pause dans Paramètres (voyage, transition…).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  text: { fontSize: 12, color: TEXT, lineHeight: 17 },
  hint: { fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 15 },
  link: { fontSize: 13, fontWeight: '700', marginTop: 8 },
});
