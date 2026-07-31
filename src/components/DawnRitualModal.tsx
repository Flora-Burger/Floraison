import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CyclePhaseId } from '../types/cycle';
import { PlantCompanion } from './PlantCompanion';
import { pickDawnGreeting } from '../constants/creativeVoice';
import { todayKey } from '../lib/dates';
import { BG, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';

type DawnRitualModalProps = {
  visible: boolean;
  phase: CyclePhaseId | null;
  onDismiss: () => void;
};

/** Première ouverture du jour — un seuil, pas une notif. */
export function DawnRitualModal({ visible, phase, onDismiss }: DawnRitualModalProps) {
  const { accent } = usePhaseAccent();
  const resolved = phase ?? 'folliculaire';
  const greeting = pickDawnGreeting(resolved, todayKey());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View
          style={[styles.card, { borderColor: accent.accent + '66' }]}
          accessibilityRole="summary"
          accessibilityLabel={`Rituel d’aube. ${greeting}`}
        >
          <Text style={styles.kicker}>Rituel d’aube</Text>
          <PlantCompanion
            phase={resolved}
            progression={resolved === 'menstruelle' ? 0.4 : 0.55}
            size={120}
            variante="commune"
          />
          <Text style={[styles.greeting, { color: ROSE_DEEP }]}>{greeting}</Text>
          <Text style={styles.hint}>Un seul seuil par jour. Ensuite, le jardin t’attend.</Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent.accent }]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Entrer dans le jour"
          >
            <Text style={styles.btnText}>Entrer dans le jour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 38, 42, 0.55)',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  greeting: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 17,
  },
  btn: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: ROSE,
  },
  btnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 15 },
});
