import type { CyclePhaseId } from '../types/cycle';
import {
  buildDailyMessageId,
  DAILY_PHASE_MESSAGES,
  type DailyMessageTone,
} from '../constants/dailyPhaseMessages';
import { parseDateKey } from './dates';
import {
  loadLastDailyMessage,
  saveLastDailyMessage,
} from './dailyMessageStorage';

export type DailyMessageResult = {
  tone: DailyMessageTone;
  text: string;
  messageId: string;
};

/** Jours pairs du mois → narratif ; impairs → scientifique. */
export function getDailyMessageTone(date: string): DailyMessageTone {
  const day = parseDateKey(date).getDate();
  return day % 2 === 0 ? 'narratif' : 'scientifique';
}

function pickMessageIndex(
  poolSize: number,
  avoidId: string | null,
  phase: CyclePhaseId,
  tone: DailyMessageTone,
): number {
  if (poolSize <= 1) return 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const index = Math.floor(Math.random() * poolSize);
    const id = buildDailyMessageId(phase, tone, index);
    if (id !== avoidId) return index;
  }
  return Math.floor(Math.random() * poolSize);
}

export function resolveDailyMessageSync(
  phase: CyclePhaseId,
  date: string,
  avoidMessageId: string | null,
): DailyMessageResult {
  const tone = getDailyMessageTone(date);
  const pool = DAILY_PHASE_MESSAGES[phase][tone];
  const index = pickMessageIndex(pool.length, avoidMessageId, phase, tone);
  return {
    tone,
    text: pool[index]!,
    messageId: buildDailyMessageId(phase, tone, index),
  };
}

export async function resolveDailyMessage(
  phase: CyclePhaseId,
  date: string,
  userId?: string,
): Promise<DailyMessageResult> {
  let avoidId: string | null = null;
  if (userId) {
    const last = await loadLastDailyMessage(userId);
    if (last) avoidId = last.messageId;
  }
  const result = resolveDailyMessageSync(phase, date, avoidId);
  if (userId) {
    await saveLastDailyMessage(userId, { messageId: result.messageId, date });
  }
  return result;
}
