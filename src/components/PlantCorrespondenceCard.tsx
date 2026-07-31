import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CaretDown, CaretUp, PaperPlaneTilt } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { todayKey } from '../lib/dates';
import { pickPlantReply } from '../constants/creativeVoice';
import {
  loadPlantLetters,
  savePlantLetter,
  type PlantLetter,
} from '../lib/creativeStorage';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';

type PlantCorrespondenceProps = {
  data: CycleData;
  userId?: string;
};

/** Écrire à la plante — elle répond (voix botanique, pas un chatbot). */
export function PlantCorrespondenceCard({ data, userId }: PlantCorrespondenceProps) {
  const { accent } = usePhaseAccent();
  const ctx = getCycleContextForDate(data, todayKey());
  const phase = ctx?.phase;
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [letters, setLetters] = useState<PlantLetter[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadPlantLetters(userId).then((list) => {
      if (!cancelled) setLetters(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || !phase) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const reply = pickPlantReply(phase, text, todayKey());
      const next = await savePlantLetter(userId, {
        date: todayKey(),
        fromUser: text,
        fromPlant: reply,
        phase,
      });
      setLetters(next);
      setDraft('');
      setExpanded(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel="Correspondance avec la plante"
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Correspondance avec la plante"
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>Écrire à la plante</Text>
          {!expanded ? (
            <Text style={styles.preview}>
              {letters[0]
                ? `Dernière réponse : « ${letters[0].fromPlant.slice(0, 36)}… »`
                : 'Une lettre courte — elle te répond à sa façon'}
            </Text>
          ) : null}
        </View>
        {expanded ? (
          <CaretUp size={18} color={MUTED} weight="bold" />
        ) : (
          <CaretDown size={18} color={MUTED} weight="bold" />
        )}
      </TouchableOpacity>

      {expanded ? (
        <>
          <Text style={styles.hint}>
            Pas un journal médical. Une confidence au pot — la réponse est botanique, jamais un conseil.
          </Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Chère plante…"
            placeholderTextColor={MUTED}
            multiline
            maxLength={280}
            textAlignVertical="top"
            accessibilityLabel="Ta lettre à la plante"
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent.accent, opacity: draft.trim() ? 1 : 0.5 }]}
            onPress={() => void send()}
            disabled={!draft.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Envoyer la lettre à la plante"
          >
            <PaperPlaneTilt size={16} color="#FFFCF9" weight="bold" />
            <Text style={styles.btnText}>{sending ? '…' : 'Envoyer'}</Text>
          </TouchableOpacity>

          {letters.slice(0, 3).map((letter) => (
            <View key={letter.id} style={styles.letter}>
              <Text style={styles.youLabel}>Toi</Text>
              <Text style={styles.youText}>{letter.fromUser}</Text>
              <Text style={[styles.plantLabel, { color: accent.accent }]}>La plante</Text>
              <Text style={styles.plantText}>{letter.fromPlant}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: TEXT },
  preview: { fontSize: 12, color: MUTED, marginTop: 2 },
  hint: { fontSize: 12, color: MUTED, lineHeight: 17, marginTop: 10, marginBottom: 10 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: TEXT,
    backgroundColor: '#FFFCF9',
    marginBottom: 10,
  },
  btn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 13 },
  letter: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
  },
  youLabel: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 0.8, marginBottom: 4 },
  youText: { fontSize: 13, color: TEXT, lineHeight: 18, marginBottom: 10 },
  plantLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  plantText: { fontSize: 13, fontStyle: 'italic', color: TEXT, lineHeight: 18 },
});
