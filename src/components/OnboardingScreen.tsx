import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { CalendarBlank, Heart, Lock, Leaf } from 'phosphor-react-native';
import { addDays, todayKey } from '../lib/dates';
import {
  BG,
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE,
  ROSE_DEEP,
  SAGE,
  TEXT,
} from '../constants/theme';

export type OnboardingResult = {
  periodStart?: string;
};

type OnboardingScreenProps = {
  onComplete: (result?: OnboardingResult) => void;
};

const TIP_STEPS = [
  {
    id: 'tips' as const,
    icon: Heart,
    emoji: '🌸',
    title: 'Note un peu chaque jour',
    body: 'Humeur, sommeil, symptômes… Plus tu notes, plus Floraison repère tes motifs. Après quelques cycles, tes insights se précisent.',
    accent: SAGE,
  },
  {
    id: 'privacy' as const,
    icon: Lock,
    emoji: '🔒',
    title: 'Tes données sont protégées',
    body: 'Ton compte et ton code PIN gardent tout en sécurité. Tu peux aussi exporter un rapport PDF pour ton médecin.',
    accent: ROSE_DEEP,
  },
];

function formatShort(key: string): string {
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const today = todayKey();
  const minDate = addDays(today, -60);

  const markedDates = useMemo(() => {
    if (!periodStart) return {};
    return {
      [periodStart]: {
        selected: true,
        selectedColor: ROSE,
        selectedTextColor: '#FFFCF9',
      },
    };
  }, [periodStart]);

  const isPeriodStep = stepIndex === 0;
  const tip = !isPeriodStep ? TIP_STEPS[stepIndex - 1] : null;
  const isLast = stepIndex === 2;

  const finish = () => {
    onComplete(periodStart ? { periodStart } : undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === stepIndex && styles.dotActive,
                i === stepIndex && {
                  backgroundColor: isPeriodStep ? ROSE : tip!.accent,
                },
              ]}
            />
          ))}
        </View>

        {isPeriodStep ? (
          <View style={[styles.card, { borderColor: ROSE + '55' }]}>
            <View style={[styles.iconWrap, { backgroundColor: ROSE + '22' }]}>
              <Leaf size={36} weight="duotone" color={ROSE} />
            </View>
            <Text style={styles.emoji}>🌱</Text>
            <Text style={styles.title}>Quand ont commencé tes dernières règles ?</Text>
            <Text style={styles.body}>
              Un seul jour suffit pour activer ta plante, le message du jour et tes prédictions.
            </Text>
            <View style={styles.calendarWrap}>
              <Calendar
                current={periodStart ?? today}
                maxDate={today}
                minDate={minDate}
                onDayPress={(day: DateData) => setPeriodStart(day.dateString)}
                markedDates={markedDates}
                firstDay={1}
                theme={{
                  backgroundColor: 'transparent',
                  calendarBackground: 'transparent',
                  textSectionTitleColor: MUTED,
                  selectedDayBackgroundColor: ROSE,
                  todayTextColor: ROSE,
                  dayTextColor: TEXT,
                  textDisabledColor: BORDER,
                  monthTextColor: TEXT,
                  arrowColor: ROSE,
                }}
              />
            </View>
            {periodStart ? (
              <Text style={styles.selectedHint}>
                Début sélectionné : {formatShort(periodStart)}
              </Text>
            ) : (
              <Text style={styles.selectedHintMuted}>Touche le jour du début de tes règles</Text>
            )}
          </View>
        ) : tip ? (
          <View style={[styles.card, { borderColor: tip.accent + '55' }]}>
            <View style={[styles.iconWrap, { backgroundColor: tip.accent + '22' }]}>
              <tip.icon size={36} weight="duotone" color={tip.accent} />
            </View>
            <Text style={styles.emoji}>{tip.emoji}</Text>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.body}>{tip.body}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {stepIndex > 0 ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStepIndex((s) => s - 1)}>
              <Text style={styles.secondaryBtnText}>Retour</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.secondaryBtnPlaceholder} />
          )}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: isPeriodStep
                  ? periodStart
                    ? ROSE
                    : BORDER
                  : tip!.accent,
              },
            ]}
            disabled={isPeriodStep && !periodStart}
            onPress={() => {
              if (isLast) finish();
              else setStepIndex((s) => s + 1);
            }}
          >
            <Text style={styles.primaryBtnText}>
              {isPeriodStep ? 'Continuer' : isLast ? "C'est parti !" : 'Suivant'}
            </Text>
          </TouchableOpacity>
        </View>

        {isPeriodStep ? (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer pour l’instant</Text>
          </TouchableOpacity>
        ) : !isLast ? (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        ) : null}

        {isPeriodStep ? (
          <View style={styles.footerHint}>
            <CalendarBlank size={14} color={MUTED} />
            <Text style={styles.footerHintText}>
              Tu pourras aussi le faire plus tard dans Suivi
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
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
    padding: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 28, marginBottom: 8 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  calendarWrap: {
    width: '100%',
    marginTop: 4,
    marginBottom: 4,
  },
  selectedHint: {
    fontSize: 13,
    fontWeight: '600',
    color: ROSE_DEEP,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedHintMuted: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
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
  skipBtn: { alignItems: 'center', marginTop: 14, padding: 8 },
  skipText: { fontSize: 14, color: MUTED, fontWeight: '500' },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerHintText: { fontSize: 12, color: MUTED },
});
