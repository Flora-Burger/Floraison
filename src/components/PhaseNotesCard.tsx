import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { getPhaseById } from '../constants/cycleContent';
import { parseDateKey, todayKey } from '../lib/dates';
import {
  loadPhaseNoteHistory,
  loadPhaseNotes,
  savePhaseNote,
  type PhaseNoteHistoryEntry,
} from '../lib/phaseNotesStorage';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';

type PhaseNotesCardProps = {
  data: CycleData;
  userId?: string;
};

function formatCycleLabel(cycleStart: string): string {
  try {
    const d = parseDateKey(cycleStart);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  } catch {
    return cycleStart;
  }
}

export function PhaseNotesCard({ data, userId }: PhaseNotesCardProps) {
  const { accent } = usePhaseAccent();
  const ctx = getCycleContextForDate(data, todayKey());
  const phase = ctx?.phase;
  const cycleStart = ctx?.periodStart;
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<PhaseNoteHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!userId || !phase) {
      setText('');
      setHistory([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const notes = await loadPhaseNotes(userId);
      const past = await loadPhaseNoteHistory(userId, phase, cycleStart);
      if (cancelled) return;
      const note = notes[phase] ?? '';
      setText(note);
      setHistory(past);
      if (note.trim()) setExpanded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, phase, cycleStart]);

  if (!phase || !userId || !cycleStart) {
    return null;
  }

  const phaseLabel = getPhaseById(phase).shortTitle;
  const preview = text.trim()
    ? text.trim().slice(0, 42) + (text.trim().length > 42 ? '…' : '')
    : 'Écrire une note pour cette phase';

  const handleSave = async () => {
    await savePhaseNote(userId, phase, text, cycleStart);
    const past = await loadPhaseNoteHistory(userId, phase, cycleStart);
    setHistory(past);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <View style={[styles.card, { borderColor: accent.accent + '44' }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Notes de phase ${phaseLabel}`}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>Notes — {phaseLabel}</Text>
          {!expanded ? (
            <Text style={styles.preview} numberOfLines={1}>
              {preview}
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
            Privé, lié à la phase. Relis ce que tu avais écrit les cycles passés.
          </Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écris librement…"
            placeholderTextColor={MUTED}
            multiline
            textAlignVertical="top"
            accessibilityLabel={`Note pour la ${phaseLabel}`}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent.accent }]}
            onPress={() => void handleSave()}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Note enregistrée' : `Enregistrer la note ${phaseLabel}`}
          >
            <Text style={styles.btnText}>{saved ? 'Enregistré' : 'Sauver'}</Text>
          </TouchableOpacity>

          {history.length > 0 ? (
            <View style={styles.historyBlock}>
              <TouchableOpacity
                style={styles.historyToggle}
                onPress={() => setHistoryOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: historyOpen }}
                accessibilityLabel={
                  historyOpen
                    ? 'Masquer les notes des cycles passés'
                    : `Voir ${history.length} notes des cycles passés`
                }
              >
                <Text style={[styles.historyTitle, { color: accent.accent }]}>
                  Cycles passés ({history.length})
                </Text>
                {historyOpen ? (
                  <CaretUp size={16} color={accent.accent} weight="bold" />
                ) : (
                  <CaretDown size={16} color={accent.accent} weight="bold" />
                )}
              </TouchableOpacity>
              {historyOpen
                ? history.map((entry) => (
                    <View key={`${entry.cycleStart}:${entry.phase}`} style={styles.historyItem}>
                      <Text style={styles.historyMeta}>
                        Cycle du {formatCycleLabel(entry.cycleStart)}
                      </Text>
                      <Text style={styles.historyText}>{entry.text}</Text>
                    </View>
                  ))
                : null}
            </View>
          ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: TEXT },
  preview: { fontSize: 12, color: MUTED, marginTop: 2 },
  hint: { fontSize: 12, color: MUTED, lineHeight: 17, marginTop: 10, marginBottom: 10 },
  input: {
    minHeight: 88,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 13 },
  historyBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyTitle: { fontSize: 13, fontWeight: '700' },
  historyItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
  },
  historyMeta: { fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: '600' },
  historyText: { fontSize: 13, color: TEXT, lineHeight: 18 },
});
