import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CyclePhaseId } from '../types/cycle';
import { getPhaseById } from '../constants/cycleContent';
import { loadHerbier, type HerbierEntry } from '../lib/creativeStorage';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { parseDateKey } from '../lib/dates';

type HerbierSectionProps = {
  userId?: string;
  /** Incrémente pour recharger après un pressage. */
  refreshKey?: number;
};

/** Herbier — vers pressés comme des fleurs séchées. */
export function HerbierSection({ userId, refreshKey = 0 }: HerbierSectionProps) {
  const { accent } = usePhaseAccent();
  const [entries, setEntries] = useState<HerbierEntry[]>([]);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    void loadHerbier(userId).then((list) => {
      if (!cancelled) setEntries(list);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  if (!userId || entries.length === 0) return null;

  return (
    <View
      style={[styles.section, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel={`Herbier, ${entries.length} vers pressés`}
    >
      <Text style={styles.kicker}>Herbier</Text>
      <Text style={styles.title}>Vers pressés</Text>
      <Text style={styles.hint}>Des saisons gardées entre deux pages.</Text>
      {entries.slice(0, 8).map((entry) => (
        <View key={entry.id} style={styles.leaf}>
          <Text style={[styles.phase, { color: accent.accent }]}>
            {phaseShort(entry.phase)} · {formatPressed(entry.pressedAt)}
          </Text>
          <Text style={styles.verse}>{entry.verse}</Text>
        </View>
      ))}
    </View>
  );
}

function phaseShort(phase: CyclePhaseId): string {
  return getPhaseById(phase).shortTitle;
}

function formatPressed(key: string): string {
  try {
    return parseDateKey(key).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return key;
  }
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { fontSize: 15, fontWeight: '800', color: TEXT, marginTop: 4 },
  hint: { fontSize: 12, color: MUTED, marginBottom: 10, marginTop: 2 },
  leaf: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: BORDER,
  },
  phase: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  verse: { fontSize: 13, fontStyle: 'italic', color: TEXT, lineHeight: 19 },
});
