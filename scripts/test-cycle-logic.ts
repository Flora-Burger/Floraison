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
import { computePersonalDiscoveries } from '../src/lib/personalDiscoveries';
import { parseNotificationNavData } from '../src/lib/notificationNav';
import { shouldPausePredictions } from '../src/lib/predictionPrefs';
import type { CycleData } from '../src/types/cycle';
import { getCycleRegularity } from '../src/lib/cycleMath';
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

function testMoodSleepDiscovery() {
  const data: CycleData = {
    '2026-01-01': { period: true },
    '2026-01-29': { period: true },
    '2026-02-26': { period: true },
    '2026-01-10': { mood: ['irritable'], sleep: ['insomnie'] },
    '2026-01-11': { mood: ['irritable'], sleep: ['insomnie'] },
    '2026-01-12': { mood: ['calme'], sleep: ['bonne_nuit'] },
    '2026-02-05': { mood: ['irritable'], sleep: ['insomnie'] },
    '2026-02-06': { mood: ['irritable'], sleep: ['insomnie'] },
  };
  const result = computePersonalDiscoveries(data);
  assert.ok(result);
  console.log('✓ motif humeur × sommeil (lib)');
}

function testNotificationNavParse() {
  assert.deepEqual(parseNotificationNavData({ screen: 'suivi', action: 'log' }), {
    screen: 'suivi',
    action: 'log',
  });
  assert.equal(parseNotificationNavData({}), null);
  console.log('✓ parse notif → Suivi');
}

function testPhaseNotesHistoryUpsert() {
  // Conservé comme smoke test de logique locale (notes de phase retirées de l’UI)
  type Entry = { cycleStart: string; phase: string; text: string };
  const history: Entry[] = [];
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
  console.log('✓ upsert historique (logique)');
}

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

function testCoreStatsAndExport() {
  const hard: CycleData = {
    '2026-06-01': { period: true },
    '2026-06-10': {
      physical: ['fatigue'],
      mood: ['irritable', 'triste'],
    },
    '2026-06-29': { period: true },
  };
  assert.equal(isHardDayEntry(hard['2026-06-10']), true);
  assert.equal(countHardDaysInRange(hard, '2026-06-01', '2026-06-29'), 1);
  const compare = computeCycleCompare(hard, '2026-07-05');
  assert.ok(compare.summary);

  const prepData: CycleData = {
    '2026-06-01': { period: true },
    '2026-06-02': { period: true },
  };
  const prep = getPeriodPrepState(prepData, '2026-06-27', 3);
  assert.ok(prep?.active);

  const json = buildPersonalExportJson({ '2026-01-01': { period: true } });
  assert.ok(json.includes('Floraison'));
  const csv = buildPersonalExportCsv({ '2026-01-01': { period: true, mood: ['calme'] } });
  assert.ok(csv.includes('date,period'));
  console.log('✓ stats cycle + export');
}

testPhaseProgression();
testPeriodWindowAndLate();
testMoodSleepDiscovery();
testNotificationNavParse();
testPhaseNotesHistoryUpsert();
testPredictionPause();
testCoreStatsAndExport();
console.log('Tous les tests OK');
