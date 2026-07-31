import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DayEntry, Flow, MoodTag, PhysicalSymptom } from '../types/cycle';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import { BG_SOFT, BORDER, MUTED, TEXT } from '../constants/theme';
import { toggleMulti } from '../lib/dayEntry';

type QuickLogBarProps = {
  entry: DayEntry;
  onChange: (patch: Partial<DayEntry>) => void;
};

const ENERGY_OPTIONS: {
  id: string;
  label: string;
  apply: (entry: DayEntry) => Partial<DayEntry>;
  active: (entry: DayEntry) => boolean;
}[] = [
  {
    id: 'basse',
    label: 'Énergie basse',
    apply: (e) => ({ physical: toggleMulti(e.physical, 'fatigue' as PhysicalSymptom) }),
    active: (e) => Boolean(e.physical?.includes('fatigue')),
  },
  {
    id: 'ok',
    label: 'Énergie ok',
    apply: (e) => ({ mood: toggleMulti(e.mood, 'calme' as MoodTag) }),
    active: (e) => Boolean(e.mood?.includes('calme')) && !e.physical?.includes('fatigue'),
  },
  {
    id: 'haute',
    label: 'Énergie haute',
    apply: (e) => ({ mood: toggleMulti(e.mood, 'energique' as MoodTag) }),
    active: (e) => Boolean(e.mood?.includes('energique')),
  },
];

const MOOD_QUICK: { id: MoodTag; label: string }[] = [
  { id: 'heureuse', label: 'Bien' },
  { id: 'sensible', label: 'Sensible' },
  { id: 'irritable', label: 'Irritable' },
];

const FLOW_QUICK: { id: Flow; label: string }[] = [
  { id: 'leger', label: 'Léger' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'fort', label: 'Fort' },
];

export function QuickLogBar({ entry, onChange }: QuickLogBarProps) {
  const { accent } = usePhaseAccent();
  const hardDayActive =
    Boolean(entry.physical?.includes('fatigue')) &&
    Boolean(entry.mood?.includes('irritable')) &&
    Boolean(entry.mood?.includes('triste'));

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel="Log rapide"
    >
      <Text style={styles.title}>Log rapide</Text>
      <Text style={styles.hint}>Un tap suffit — tu peux affiner plus bas</Text>

      <TouchableOpacity
        style={[
          styles.hardDayBtn,
          {
            borderColor: accent.accent + '66',
            backgroundColor: hardDayActive ? accent.accent + '18' : '#FFFCF9',
          },
        ]}
        onPress={() => {
          const physical = entry.physical?.includes('fatigue')
            ? entry.physical
            : [...(entry.physical ?? []), 'fatigue' as PhysicalSymptom];
          const moodSet = new Set(entry.mood ?? []);
          moodSet.add('irritable');
          moodSet.add('triste');
          onChange({
            physical,
            mood: Array.from(moodSet) as MoodTag[],
          });
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: hardDayActive }}
        accessibilityLabel="Mode jour difficile : fatigue et humeur basse"
      >
        <Text style={[styles.hardDayText, { color: accent.accent }]}>
          {hardDayActive
            ? 'Jour difficile — noté'
            : 'Jour difficile — un tap pour le pack doux'}
        </Text>
      </TouchableOpacity>
      {hardDayActive ? (
        <Text style={styles.hardDaySupport}>
          C’est ok d’avoir un jour lourd. Ta plante reste là — un pas à la fois.
        </Text>
      ) : null}

      <Text style={styles.rowLabel}>Énergie</Text>
      <View style={styles.row}>
        {ENERGY_OPTIONS.map((opt) => {
          const on = opt.active(entry);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.chip,
                on && { backgroundColor: accent.accent, borderColor: accent.accent },
              ]}
              onPress={() => onChange(opt.apply(entry))}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.rowLabel}>Humeur</Text>
      <View style={styles.row}>
        {MOOD_QUICK.map((opt) => {
          const on = Boolean(entry.mood?.includes(opt.id));
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.chip,
                on && { backgroundColor: accent.accent, borderColor: accent.accent },
              ]}
              onPress={() => onChange({ mood: toggleMulti(entry.mood, opt.id) })}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Humeur ${opt.label}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.rowLabel}>Flux</Text>
      <View style={styles.row}>
        {FLOW_QUICK.map((opt) => {
          const on = entry.flow === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.chip,
                on && { backgroundColor: accent.accent, borderColor: accent.accent },
              ]}
              onPress={() =>
                onChange({
                  period: true,
                  flow: on ? undefined : opt.id,
                })
              }
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Flux ${opt.label}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
  },
  hint: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    marginBottom: 10,
  },
  hardDayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFCF9',
    marginBottom: 10,
  },
  hardDayText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  hardDaySupport: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: -4,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFCF9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  chipTextOn: {
    color: '#FFFCF9',
  },
});
