import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BG_SOFT, BORDER, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type PinPadProps = {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  error?: string;
  resetKey?: string;
};

export function PinPad({ title, subtitle, onComplete, error, resetKey }: PinPadProps) {
  const [digits, setDigits] = useState('');

  useEffect(() => {
    setDigits('');
  }, [resetKey]);

  const handleDigit = (n: string) => {
    if (digits.length >= 4) return;
    const next = digits + n;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => onComplete(next), 150);
    }
  };

  const handleDelete = () => setDigits((d) => d.slice(0, -1));
  const padKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, digits.length > i && styles.dotFilled]} />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.pad}>
        {padKeys.map((k, i) =>
          k === '' ? (
            <View key={i} style={styles.keyEmpty} />
          ) : (
            <TouchableOpacity
              key={i}
              style={styles.key}
              onPress={() => (k === '⌫' ? handleDelete() : handleDigit(k))}
            >
              <Text style={styles.keyText}>{k}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  title: { fontSize: 20, fontWeight: '700', color: ROSE_DEEP, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: TEXT, opacity: 0.7, marginBottom: 20, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: ROSE, borderColor: ROSE },
  error: { color: ROSE_DEEP, fontSize: 14, marginBottom: 8, textAlign: 'center' },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    marginTop: 8,
  },
  key: {
    width: 72,
    height: 72,
    margin: 8,
    borderRadius: 36,
    backgroundColor: BG_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  keyEmpty: { width: 72, height: 72, margin: 8 },
  keyText: { fontSize: 24, fontWeight: '600', color: TEXT },
});
