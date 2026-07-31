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
import { pickDawnGreeting, pickPlantReply } from '../src/constants/creativeVoice';
import { pickCycleSeasonVerse } from '../src/constants/cycleSeasonVerses';
import { pickPlantWhisper } from '../src/lib/plantWhisper';

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
testSeasonAndWhisper();
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

function testSeasonAndWhisper() {
  const a = pickCycleSeasonVerse('folliculaire', '2026-07-31');
  const b = pickCycleSeasonVerse('folliculaire', '2026-07-31');
  assert.equal(a, b);
  assert.ok(a.length > 10);
  const w = pickPlantWhisper({ phase: 'menstruelle', dateKey: '2026-07-31', hardDay: true });
  assert.ok(w.includes('toi') || w.includes('Je') || w.includes('Pose'));
  const dawn = pickDawnGreeting('ovulatoire', '2026-07-31');
  assert.ok(dawn.length > 8);
  const reply = pickPlantReply('luteale', 'bonjour plante', '2026-07-31');
  assert.ok(reply.length > 8);
  console.log('✓ saison + murmure + aube + lettre');
}
