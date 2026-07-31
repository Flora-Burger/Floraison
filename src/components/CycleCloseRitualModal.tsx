import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CycleCloseSummary } from '../lib/cycleClose';
import { PlantCompanion } from './PlantCompanion';
import { BG, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type CycleCloseRitualModalProps = {
  visible: boolean;
  summary: CycleCloseSummary | null;
  onDismiss: () => void;
};

export function CycleCloseRitualModal({
  visible,
  summary,
  onDismiss,
}: CycleCloseRitualModalProps) {
  if (!summary) return null;

  const a11ySummary = [
    'Cycle terminé.',
    summary.companionLine,
    ...summary.lines,
  ].join(' ');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.overlay} accessibilityRole="none">
        <View
          style={styles.card}
          accessibilityRole="summary"
          accessibilityLabel={a11ySummary}
        >
          <PlantCompanion
            phase="ovulatoire"
            progression={0.55}
            size={100}
            variante="commune"
            speciesId={summary.speciesId}
          />
          <Text style={styles.title} accessibilityRole="header">
            Ce cycle en 3 lignes
          </Text>
          <Text style={styles.companion}>{summary.companionLine}</Text>
          {summary.lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
          <TouchableOpacity
            style={styles.btn}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le nouveau cycle"
          >
            <Text style={styles.btnText}>Ouvrir le nouveau cycle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(40,30,35,0.45)',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginTop: 12,
    marginBottom: 8,
  },
  companion: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  line: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
    alignSelf: 'stretch',
  },
  btn: {
    marginTop: 16,
    backgroundColor: ROSE,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: {
    color: '#FFFCF9',
    fontWeight: '700',
    fontSize: 15,
  },
});
