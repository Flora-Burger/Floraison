import { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarBlank, Heart, Lock } from 'phosphor-react-native';
import {
  BG,
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE,
  ROSE_DEEP,
  SAGE,
  SAGE_LIGHT,
  TEXT,
} from '../constants/theme';

type OnboardingScreenProps = {
  onComplete: () => void;
};

const STEPS = [
  {
    icon: CalendarBlank,
    emoji: '🩸',
    title: 'Commence par tes règles',
    body: "Appuie sur un jour du calendrier et active « Règles aujourd'hui ». C'est la base pour prédire ton cycle et tes prochaines règles.",
    accent: ROSE,
  },
  {
    icon: Heart,
    emoji: '🌸',
    title: 'Note un peu chaque jour',
    body: 'Humeur, sommeil, symptômes… Plus tu notes, plus Floraison repère tes patterns. Après 2 cycles, tes insights seront personnalisés.',
    accent: SAGE,
  },
  {
    icon: Lock,
    emoji: '🔒',
    title: 'Tes données sont protégées',
    body: 'Ton compte et ton code PIN gardent tout en sécurité. Tu peux aussi exporter un rapport PDF pour ton médecin.',
    accent: ROSE_DEEP,
  },
] as const;

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i === step && { backgroundColor: current.accent }]}
            />
          ))}
        </View>

        <View style={[styles.card, { borderColor: current.accent + '55' }]}>
          <View style={[styles.iconWrap, { backgroundColor: current.accent + '22' }]}>
            <Icon size={36} weight="duotone" color={current.accent} />
          </View>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>

        <View style={styles.actions}>
          {step > 0 ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.secondaryBtnPlaceholder} />
          )}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: current.accent }]}
            onPress={() => {
              if (isLast) onComplete();
              else setStep(step + 1);
            }}
          >
            <Text style={styles.primaryBtnText}>{isLast ? "C'est parti !" : 'Suivant'}</Text>
          </TouchableOpacity>
        </View>

        {!isLast ? (
          <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
  },
  dotActive: { width: 24 },
  card: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: { fontSize: 32, marginBottom: 12 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    color: MUTED,
    lineHeight: 23,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryBtnPlaceholder: { flex: 1 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: MUTED },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFCF9' },
  skipBtn: { alignItems: 'center', marginTop: 16, padding: 8 },
  skipText: { fontSize: 14, color: MUTED, fontWeight: '500' },
});
