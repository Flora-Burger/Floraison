/** Payload embarqué dans les rappels locaux — ouvre Suivi / log du jour. */
export type NotificationNavData = {
  screen: 'suivi';
  action: 'log' | 'period';
};

export function parseNotificationNavData(
  data: unknown,
): NotificationNavData | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.screen !== 'suivi') return null;
  if (d.action !== 'log' && d.action !== 'period') return null;
  return { screen: 'suivi', action: d.action };
}
