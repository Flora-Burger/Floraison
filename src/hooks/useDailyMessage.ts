import { useEffect, useState } from 'react';
import type { CyclePhaseId } from '../types/cycle';
import {
  resolveDailyMessage,
  resolveDailyMessageSync,
  type DailyMessageContext,
  type DailyMessageResult,
} from '../lib/dailyMessage';

export function useDailyMessage(
  phase: CyclePhaseId | null | undefined,
  userId: string | undefined,
  date: string,
  context: DailyMessageContext = 'default',
): DailyMessageResult | null {
  const [message, setMessage] = useState<DailyMessageResult | null>(() =>
    phase ? resolveDailyMessageSync(phase, date, null, context) : null,
  );

  useEffect(() => {
    if (!phase) {
      setMessage(null);
      return;
    }
    setMessage(resolveDailyMessageSync(phase, date, null, context));
    let cancelled = false;
    void resolveDailyMessage(phase, date, userId, context).then((result) => {
      if (!cancelled) setMessage(result);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, userId, date, context]);

  return message;
}
