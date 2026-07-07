import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { PinPad } from './PinPad';
import { CARD } from '../constants/theme';

type PinSetupModalProps = {
  visible: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
};

export function PinSetupModal({ visible, onClose, onComplete }: PinSetupModalProps) {
  const [mode, setMode] = useState<'create' | 'confirm'>('create');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setMode('create');
    setDraft('');
    setError('');
    onClose();
  };

  const handlePin = (pin: string) => {
    setError('');
    if (mode === 'create') {
      setDraft(pin);
      setMode('confirm');
      return;
    }
    if (pin !== draft) {
      setError('Les codes ne correspondent pas. Réessayez.');
      setMode('create');
      setDraft('');
      return;
    }
    onComplete(pin);
    handleClose();
  };

  const title = mode === 'create' ? 'Choisissez un code PIN' : 'Confirmez votre code PIN';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <PinPad
            title={title}
            subtitle="Protection locale — jamais envoyé au serveur"
            onComplete={handlePin}
            error={error}
            resetKey={mode + error}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 63, 71, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
});
