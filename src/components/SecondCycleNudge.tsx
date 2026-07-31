import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkle } from 'phosphor-react-native';
import { BG, BG_SOFT, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type SecondCycleNudgeProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function SecondCycleNudge({ visible, onDismiss }: SecondCycleNudgeProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Sparkle size={28} weight="fill" color={ROSE} />
          </View>
          <Text style={styles.title}>Deuxième cycle commencé</Text>
          <Text style={styles.body}>
            Tes motifs et prédictions vont se préciser. Continue à noter quelques jours par phase —
            Insights s’enrichit tout seul.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Compris</Text>
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
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ROSE + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: ROSE_DEEP,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: ROSE,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  btnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 15 },
});
