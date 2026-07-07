import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { BG, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type PasswordResetScreenProps = {
  onSubmit: (password: string) => Promise<string | null>;
  onCancel: () => void;
};

export function PasswordResetScreen({ onSubmit, onCancel }: PasswordResetScreenProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const err = await onSubmit(password);
      if (err) setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Choisissez un nouveau mot de passe pour votre compte Floraison.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          placeholderTextColor={MUTED}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={MUTED}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.linkText}>Annuler</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: ROSE_DEEP, textAlign: 'center' },
  subtitle: { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT,
    backgroundColor: '#FFFCF9',
  },
  error: { color: ROSE_DEEP, fontSize: 14, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: ROSE,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFCF9', fontSize: 16, fontWeight: '700' },
  linkText: { color: ROSE_DEEP, fontSize: 14, textAlign: 'center', fontWeight: '600', marginTop: 8 },
});
