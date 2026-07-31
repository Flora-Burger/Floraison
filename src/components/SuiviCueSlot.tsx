import { useEffect, useState } from 'react';
import type { CycleData } from '../types/cycle';
import type { PredictionPrefs } from '../lib/predictionPrefs';
import { predictionPauseReason } from '../lib/predictionPrefs';
import { getPeriodPrepState } from '../lib/cycleStats';
import { todayKey } from '../lib/dates';
import {
  cycleConfigFromData,
  getPlantPhaseFromData,
} from '../lib/plantPhase';
import {
  loadPlantGallery,
  shouldRollFlowerVariant,
} from '../lib/plantRarity';
import { SoftPredictionsBanner } from './SoftPredictionsBanner';
import { PeriodPrepBanner } from './PeriodPrepBanner';
import { OvulationBloomCue } from './OvulationBloomCue';
import { SoftStreakBanner } from './SoftStreakBanner';

type SuiviCueSlotProps = {
  data: CycleData;
  userId?: string;
  predPrefs: PredictionPrefs;
  onPredResume: () => void;
};

type CueKind = 'predictions' | 'prep' | 'bloom' | 'streak' | null;

/**
 * Une seule bannière contextuelle sous le message du jour.
 * Priorité : prédictions pause/doux → prep règles → floraison → streak.
 */
export function SuiviCueSlot({
  data,
  userId,
  predPrefs,
  onPredResume,
}: SuiviCueSlotProps) {
  const [bloomActive, setBloomActive] = useState(false);

  useEffect(() => {
    const today = todayKey();
    const plant = getPlantPhaseFromData(data, today);
    const cycleStart =
      cycleConfigFromData(data, today)?.dateDebutDernieresRegles ?? null;
    if (!plant || !cycleStart) {
      setBloomActive(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // Fenêtre de tirage ou tout juste avant — pas toute la lutéale
      const nearRoll =
        (plant.phase === 'ovulatoire' &&
          plant.progression >= 0.35 &&
          plant.progression <= 0.75) ||
        (plant.phase === 'folliculaire' && plant.progression >= 0.85);

      if (!nearRoll) {
        if (!cancelled) setBloomActive(false);
        return;
      }

      if (!userId) {
        if (!cancelled) setBloomActive(nearRoll);
        return;
      }

      const gallery = await loadPlantGallery(userId);
      if (cancelled) return;
      if (gallery.byCycle[cycleStart]) {
        // Déjà tirée : le badge plante suffit, pas de bannière
        setBloomActive(false);
        return;
      }
      setBloomActive(
        shouldRollFlowerVariant(
          plant.phase,
          plant.progression,
          cycleStart,
          gallery,
        ) ||
          (plant.phase === 'folliculaire' && plant.progression >= 0.85),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [data, userId]);

  const cue: CueKind = (() => {
    const pause = predictionPauseReason(data, predPrefs);
    if (pause) return 'predictions';
    if (getPeriodPrepState(data, todayKey(), 3)?.active) return 'prep';
    if (bloomActive) return 'bloom';
    return 'streak';
  })();

  if (cue === 'predictions') {
    return (
      <SoftPredictionsBanner
        data={data}
        prefs={predPrefs}
        onResume={onPredResume}
      />
    );
  }
  if (cue === 'prep') return <PeriodPrepBanner data={data} />;
  if (cue === 'bloom') return <OvulationBloomCue data={data} userId={userId} />;
  return <SoftStreakBanner data={data} minStreak={3} />;
}
