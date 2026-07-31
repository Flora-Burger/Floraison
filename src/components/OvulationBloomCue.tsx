import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flower } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { todayKey } from '../lib/dates';
import {
  cycleConfigFromData,
  getPlantPhaseFromData,
} from '../lib/plantPhase';
import {
  loadPlantGallery,
  shouldRollFlowerVariant,
} from '../lib/plantRarity';
import { BG_SOFT, BORDER, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';

type OvulationBloomCueProps = {
  data: CycleData;
  userId?: string;
};

/** Petit rappel Suivi pendant la fenêtre de tirage ovulation (pas toute la lutéale). */
export function OvulationBloomCue({ data, userId }: OvulationBloomCueProps) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const today = todayKey();
    const plant = getPlantPhaseFromData(data, today);
    const cycleStart =
      cycleConfigFromData(data, today)?.dateDebutDernieresRegles ?? null;
    if (!plant || !cycleStart) {
      setLine(null);
      return;
    }

    let cancelled = false;
    (async () => {
      if (!userId) {
        if (
          plant.phase === 'ovulatoire' &&
          plant.progression >= 0.35 &&
          plant.progression <= 0.75
        ) {
          if (!cancelled) {
            setLine(
              'Fenêtre de floraison — connecte-toi pour garder la fleur de ce cycle.',
            );
          }
        } else if (plant.phase === 'folliculaire' && plant.progression >= 0.85) {
          if (!cancelled) {
            setLine('Bientôt l’ovulation : une fleur pourra s’ouvrir pour ce cycle.');
          }
        } else if (!cancelled) {
          setLine(null);
        }
        return;
      }

      const gallery = await loadPlantGallery(userId);
      if (cancelled) return;
      if (gallery.byCycle[cycleStart]) {
        // Badge plante suffit
        setLine(null);
        return;
      }

      if (
        shouldRollFlowerVariant(
          plant.phase,
          plant.progression,
          cycleStart,
          gallery,
        )
      ) {
        setLine(
          'Fenêtre de floraison — une espèce est tirée pour ce cycle. Voir l’album dans Insights.',
        );
        return;
      }

      if (plant.phase === 'folliculaire' && plant.progression >= 0.85) {
        setLine(
          'Bientôt l’ovulation : une fleur de la collection pourra s’ouvrir.',
        );
        return;
      }

      setLine(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [data, userId]);

  if (!line) return null;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={line}
    >
      <Flower size={18} weight="duotone" color={ROSE} />
      <View style={styles.copy}>
        <Text style={styles.title}>Collection florale</Text>
        <Text style={styles.body}>{line}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  copy: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT,
  },
});
