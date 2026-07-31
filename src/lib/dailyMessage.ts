import type { CyclePhaseId } from '../types/cycle';
import {
  buildDailyMessageId,
  DAILY_PHASE_MESSAGES,
  LATE_LUTEAL_MESSAGES,
  type DailyMessageTone,
} from '../constants/dailyPhaseMessages';
import { parseDateKey } from './dates';
import {
  loadLastDailyMessage,
  saveLastDailyMessage,
} from './dailyMessageStorage';

export type DailyMessageContext = 'default' | 'late_luteal';

export type DailyMessageResult = {
  tone: DailyMessageTone;
  text: string;
  messageId: string;
  context: DailyMessageContext;
};

/** Jours pairs du mois → narratif ; impairs → scientifique. */
export function getDailyMessageTone(date: string): DailyMessageTone {
  const day = parseDateKey(date).getDate();
  return day % 2 === 0 ? 'narratif' : 'scientifique';
}

function messagePool(
  phase: CyclePhaseId,
  tone: DailyMessageTone,
  context: DailyMessageContext,
): string[] {
  if (phase === 'luteale' && context === 'late_luteal') {
    return LATE_LUTEAL_MESSAGES[tone];
  }
  return DAILY_PHASE_MESSAGES[phase][tone];
}

function parseMessageId(messageId: string): {
  phase: CyclePhaseId;
  tone: DailyMessageTone;
  index: number;
  context: DailyMessageContext;
} | null {
  const parts = messageId.split(':');
  if (parts.length < 3) return null;

  let context: DailyMessageContext = 'default';
  let phase: string;
  let tone: string;
  let indexRaw: string;

  if (parts[0] === 'late_luteal') {
    context = 'late_luteal';
    tone = parts[1]!;
    indexRaw = parts[2]!;
    phase = 'luteale';
  } else {
    phase = parts[0]!;
    tone = parts[1]!;
    indexRaw = parts[2]!;
  }

  const index = Number(indexRaw);
  if (
    (tone !== 'narratif' && tone !== 'scientifique') ||
    !Number.isInteger(index) ||
    index < 0
  ) {
    return null;
  }

  const pool = messagePool(phase as CyclePhaseId, tone as DailyMessageTone, context);
  if (!pool || index >= pool.length) return null;

  return {
    phase: phase as CyclePhaseId,
    tone: tone as DailyMessageTone,
    index,
    context,
  };
}

export function buildDailyMessageIdWithContext(
  phase: CyclePhaseId,
  tone: DailyMessageTone,
  index: number,
  context: DailyMessageContext = 'default',
): string {
  if (context === 'late_luteal') {
    return `late_luteal:${tone}:${index}`;
  }
  return buildDailyMessageId(phase, tone, index);
}

function resultFromId(messageId: string): DailyMessageResult | null {
  const parsed = parseMessageId(messageId);
  if (!parsed) return null;
  const pool = messagePool(parsed.phase, parsed.tone, parsed.context);
  return {
    tone: parsed.tone,
    text: pool[parsed.index]!,
    messageId,
    context: parsed.context,
  };
}

function pickMessageIndex(
  poolSize: number,
  avoidId: string | null,
  phase: CyclePhaseId,
  tone: DailyMessageTone,
  context: DailyMessageContext,
): number {
  if (poolSize <= 1) return 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const index = Math.floor(Math.random() * poolSize);
    const id = buildDailyMessageIdWithContext(phase, tone, index, context);
    if (id !== avoidId) return index;
  }
  return Math.floor(Math.random() * poolSize);
}

export function resolveDailyMessageSync(
  phase: CyclePhaseId,
  date: string,
  avoidMessageId: string | null,
  context: DailyMessageContext = 'default',
): DailyMessageResult {
  const tone = getDailyMessageTone(date);
  const pool = messagePool(phase, tone, context);
  const index = pickMessageIndex(pool.length, avoidMessageId, phase, tone, context);
  return {
    tone,
    text: pool[index]!,
    messageId: buildDailyMessageIdWithContext(phase, tone, index, context),
    context,
  };
}

export async function resolveDailyMessage(
  phase: CyclePhaseId,
  date: string,
  userId?: string,
  context: DailyMessageContext = 'default',
): Promise<DailyMessageResult> {
  if (userId) {
    const last = await loadLastDailyMessage(userId);
    if (last?.date === date) {
      const existing = resultFromId(last.messageId);
      if (existing) {
        const parsed = parseMessageId(last.messageId);
        const samePhase = parsed?.phase === phase;
        const sameContext = existing.context === context;
        if (samePhase && sameContext) {
          return existing;
        }
      }
    }
    const avoidId = last?.date !== date ? last?.messageId ?? null : null;
    const result = resolveDailyMessageSync(phase, date, avoidId, context);
    await saveLastDailyMessage(userId, { messageId: result.messageId, date });
    return result;
  }

  return resolveDailyMessageSync(phase, date, null, context);
}
