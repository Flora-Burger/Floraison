import { useEffect, useState } from 'react';
import type { CyclePhaseId } from '../types/cycle';
import { resolveDailyMessage, type DailyMessageResult } from '../lib/dailyMessage';

export function useDailyMessage(
  phase: CyclePhaseId | null | undefined,
  userId: string | undefined,
  date: string,
): DailyMessageResult | null {
  const [message, setMessage] = useState<DailyMessageResult | null>(null);

  useEffect(() => {
    if (!phase) {
      setMessage(null);
      return;
    }
    let cancelled = false;
    void resolveDailyMessage(phase, date, userId).then((result) => {
      if (!cancelled) setMessage(result);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, userId, date]);

  return message;
}
