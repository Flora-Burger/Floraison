/**
 * Tests légers sans Jest — exécuter : npx --yes tsx scripts/test-cycle-logic.ts
 */
import assert from 'node:assert/strict';
import { getPhaseEtProgression } from '../src/lib/plantPhase';
import {
  formatNextPeriodRangeLabel,
  getNextPeriodWindow,
} from '../src/lib/cyclePredictions';
import { getPeriodOverdueDays, isPeriodDueOrLate } from '../src/lib/periodTiming';
import { detectCycleClose, buildFriendShareCard } from '../src/lib/cycleClose';
import { computePersonalDiscoveries } from '../src/lib/personalDiscoveries';
import { parseNotificationNavData } from '../src/lib/notificationNav';
import { shouldPausePredictions } from '../src/lib/predictionPrefs';
import type { CycleData } from '../src/types/cycle';
import { getCycleRegularity } from '../src/lib/cycleMath';
import { pickDawnGreeting } from '../src/constants/creativeVoice';
import {
  collectionProgress,
  FLOWER_SPECIES,
  rollFlowerSpecies,
  speciesFromLegacyVariante,
} from '../src/constants/flowerSpecies';
import { resolveAlbumSeason, pickSignatureSpecies } from '../src/constants/albumSeason';
import { shouldRollFlowerVariant } from '../src/lib/plantRarity';
import { pickPlantWhisper } from '../src/lib/plantWhisper';
import { mergeGalleries } from '../src/lib/companionSync';
import type { PlantGalleryState } from '../src/lib/plantRarity';
import {
  getPeriodPrepState,
  isHardDayEntry,
  countHardDaysInRange,
} from '../src/lib/cycleStats';
import { computeCycleCompare } from '../src/lib/cycleCompare';
import { buildPersonalExportCsv, buildPersonalExportJson } from '../src/lib/exportPersonalFormat';

function testPhaseProgression() {
  const config = {
    dureeCycleMoyenne: 28,
    dureeRegles: 5,
    dureeOvulatoire: 1,
    dureeLuteale: 14,
    dateDebutDernieresRegles: '2026-06-01',
  };
  const d1 = getPhaseEtProgression('2026-06-01', config);
  assert.equal(d1.phase, 'menstruelle');

  const ov = getPhaseEtProgression('2026-06-14', config);
  assert.equal(ov.phase, 'ovulatoire');

  const late = getPhaseEtProgression('2026-07-05', config);
  assert.equal(late.phase, 'luteale');
  assert.equal(late.progression, 1);
  console.log('✓ getPhaseEtProgression');
}

function testPeriodWindowAndLate() {
  const data: CycleData = {
    '2026-06-01': { period: true },
    '2026-06-02': { period: true },
    '2026-05-04': { period: true },
    '2026-05-05': { period: true },
  };
  const window = getNextPeriodWindow(data, '2026-06-20');
  assert.ok(window);
  assert.ok(window!.start <= window!.end);

  const label = formatNextPeriodRangeLabel(data, '2026-06-20');
  assert.ok(label && label.includes('Règles'));

  assert.equal(isPeriodDueOrLate(data, '2026-06-29'), true);
  assert.equal(isPeriodDueOrLate(data, '2026-06-15'), false);
  assert.ok(getPeriodOverdueDays(data, '2026-07-02') >= 2);
  console.log('✓ période fourchette + retard');
}

function testCycleCloseAndFriendShare() {
  const prev: CycleData = {
    '2026-05-01': { period: true },
    '2026-05-28': { period: true },
  };
  const next: CycleData = {
    ...prev,
    '2026-06-25': { period: true },
  };
  const summary = detectCycleClose(prev, next, { period: true }, '2026-06-25');
  assert.ok(summary);
  assert.equal(summary!.previousStart, '2026-05-28');
  assert.equal(summary!.previousLength, 28);
  assert.equal(summary!.lines.length, 3);

  assert.equal(
    detectCycleClose(prev, prev, { period: true }, '2026-05-28'),
    null,
  );

  const card = buildFriendShareCard(next, '2026-06-25');
  assert.ok(card);
  assert.ok(card!.body.includes('phase'));
  assert.ok(!card!.body.includes('2026-05'));
  console.log('✓ clôture cycle + partage amie');
}

function testMoodSleepDiscovery() {
  const data: CycleData = {
    '2026-03-01': { period: true },
    '2026-03-29': { period: true },
    '2026-04-26': { period: true },
  };

  for (let i = 2; i <= 6; i++) {
    data[`2026-03-0${i}`] = {
      sleep: ['insomnie'],
      mood: ['irritable', 'triste'],
    };
  }
  for (let i = 10; i <= 14; i++) {
    data[`2026-03-${i}`] = {
      sleep: ['bonne_nuit'],
      mood: ['calme'],
    };
  }

  const result = computePersonalDiscoveries(data);
  assert.equal(result.ready, true);
  const moodSleep = result.discoveries.find((d) => d.kind === 'mood_sleep_correlation');
  assert.ok(moodSleep);
  assert.equal(moodSleep!.icon, 'sleep');
  console.log('✓ motif humeur × sommeil');
}

function testNotificationNavParse() {
  assert.deepEqual(parseNotificationNavData({ screen: 'suivi', action: 'log' }), {
    screen: 'suivi',
    action: 'log',
  });
  assert.deepEqual(parseNotificationNavData({ screen: 'suivi', action: 'period' }), {
    screen: 'suivi',
    action: 'period',
  });
  assert.equal(parseNotificationNavData({ screen: 'insights' }), null);
  assert.equal(parseNotificationNavData(null), null);
  console.log('✓ parse notif → Suivi');
}

function testPhaseNotesHistoryUpsert() {
  const history: { cycleStart: string; phase: string; text: string }[] = [];
  const upsert = (cycleStart: string, phase: string, text: string) => {
    const trimmed = text.trim();
    const idx = history.findIndex((e) => e.cycleStart === cycleStart && e.phase === phase);
    if (!trimmed) {
      if (idx >= 0) history.splice(idx, 1);
      return;
    }
    const entry = { cycleStart, phase, text: trimmed };
    if (idx >= 0) history[idx] = entry;
    else history.push(entry);
  };
  upsert('2026-03-01', 'luteale', 'Fatiguée');
  upsert('2026-03-29', 'luteale', 'Encore sensible');
  upsert('2026-03-01', 'luteale', 'Fatiguée mais ok');
  assert.equal(history.length, 2);
  assert.equal(history.find((e) => e.cycleStart === '2026-03-01')!.text, 'Fatiguée mais ok');
  upsert('2026-03-29', 'luteale', '   ');
  assert.equal(history.length, 1);
  console.log('✓ notes de phase historique');
}

testPhaseProgression();
testPeriodWindowAndLate();
testCycleCloseAndFriendShare();
testMoodSleepDiscovery();
testNotificationNavParse();
testPhaseNotesHistoryUpsert();
testPredictionPause();
testFlowerCollection();
testNewProductIdeas();
console.log('Tous les tests OK');

function testPredictionPause() {
  const irregular: CycleData = {
    '2026-01-01': { period: true },
    '2026-02-05': { period: true },
    '2026-03-01': { period: true },
  };
  assert.equal(getCycleRegularity(irregular).status, 'irregular');
  assert.equal(shouldPausePredictions(irregular, { pausePredictions: false }), true);
  assert.equal(shouldPausePredictions({}, { pausePredictions: true }), true);
  assert.equal(shouldPausePredictions({}, { pausePredictions: false }), false);
  console.log('✓ pause prédictions');
}

function testFlowerCollection() {
  assert.equal(FLOWER_SPECIES.length, 8);
  assert.equal(speciesFromLegacyVariante('rare'), 'pavot');
  assert.equal(speciesFromLegacyVariante('tres_rare'), 'orchidee');

  let i = 0;
  const seq = [0.5, 0.1, 0.01, 0.2, 0.5];
  const rng = () => seq[i++ % seq.length]!;
  const a = rollFlowerSpecies(rng);
  assert.ok(a.id);
  assert.ok(['commune', 'rare', 'tres_rare'].includes(a.rarity));

  const empty: PlantGalleryState = { byCycle: {}, seenVariants: [] };
  assert.equal(
    shouldRollFlowerVariant('ovulatoire', 0.5, '2026-06-01', empty),
    true,
  );
  assert.equal(
    shouldRollFlowerVariant('ovulatoire', 0.1, '2026-06-01', empty),
    false,
  );
  assert.equal(
    shouldRollFlowerVariant('folliculaire', 0.5, '2026-06-01', empty),
    false,
  );

  const progress = collectionProgress(['capucine', 'pavot', 'capucine']);
  assert.equal(progress.found, 2);
  assert.equal(progress.total, 8);

  const merged = mergeGalleries(
    {
      byCycle: {
        a: {
          cycleStart: 'a',
          variante: 'commune',
          speciesId: 'bleuet',
          seenAt: '2026-01-02',
        },
      },
      seenVariants: ['commune'],
      seenSpecies: ['bleuet'],
    },
    {
      byCycle: {
        a: {
          cycleStart: 'a',
          variante: 'rare',
          speciesId: 'lys',
          seenAt: '2026-01-03',
        },
      },
      seenVariants: ['rare'],
      seenSpecies: ['lys'],
    },
  );
  assert.equal(merged.byCycle.a?.speciesId, 'lys');
  assert.ok(merged.seenSpecies?.includes('lys'));

  const w = pickPlantWhisper({ phase: 'menstruelle', dateKey: '2026-07-31', hardDay: true });
  assert.ok(w.includes('toi') || w.includes('Je') || w.includes('Pose'));
  const dawn = pickDawnGreeting('ovulatoire', '2026-07-31');
  assert.ok(dawn.length > 8);
  console.log('✓ collection florale + murmure + aube');
}

function testNewProductIdeas() {
  assert.equal(resolveAlbumSeason(0).id, 'printemps');
  assert.equal(resolveAlbumSeason(3).id, 'ete');
  assert.equal(resolveAlbumSeason(6).id, 'automne');
  assert.equal(resolveAlbumSeason(10).id, 'hiver');

  const sig = pickSignatureSpecies(
    ['capucine', 'pavot'],
    ['capucine', 'capucine', 'pavot'],
  );
  assert.equal(sig?.id, 'capucine');

  const hard: CycleData = {
    '2026-06-01': { period: true },
    '2026-06-10': {
      physical: ['fatigue'],
      mood: ['irritable', 'triste'],
    },
    '2026-06-29': { period: true },
    '2026-07-05': {
      physical: ['fatigue'],
      mood: ['irritable', 'triste'],
    },
  };
  assert.equal(isHardDayEntry(hard['2026-06-10']), true);
  assert.equal(countHardDaysInRange(hard, '2026-06-01', '2026-06-29'), 1);

  const compare = computeCycleCompare(hard, '2026-07-10');
  assert.ok(compare.hardDaysLine);

  const prepData: CycleData = {
    '2026-06-01': { period: true },
    '2026-06-02': { period: true },
  };
  // moyenne 28 → prochain départ ~2026-06-29 ; 3 j avant = 26
  const prep = getPeriodPrepState(prepData, '2026-06-27', 3);
  assert.ok(prep?.active);

  const closed = detectCycleClose(
    {
      '2026-05-01': { period: true, mood: ['calme'] },
      '2026-05-15': { mood: ['heureuse'] },
    },
    {
      '2026-05-01': { period: true, mood: ['calme'] },
      '2026-05-15': { mood: ['heureuse'] },
      '2026-05-29': { period: true },
    },
    { period: true },
    '2026-05-29',
  );
  assert.ok(closed);
  assert.equal(closed!.lines.length, 3);
  assert.ok((closed!.loggedDays ?? 0) >= 1);

  const json = buildPersonalExportJson({ '2026-01-01': { period: true } });
  assert.ok(json.includes('Floraison'));
  const csv = buildPersonalExportCsv({ '2026-01-01': { period: true, mood: ['calme'] } });
  assert.ok(csv.includes('date,period'));
  assert.ok(csv.includes('calme'));
  console.log('✓ saisons, signature, prep, clôture, export');
}
