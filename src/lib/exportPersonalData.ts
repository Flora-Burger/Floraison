import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import type { CycleData } from '../types/cycle';
import { todayKey } from './dates';
import { alertAsync } from './confirmDialog';
import {
  buildPersonalExportCsv,
  buildPersonalExportJson,
} from './exportPersonalFormat';

export { buildPersonalExportCsv, buildPersonalExportJson };

/** Partage texte JSON ou CSV via la feuille native (ou Share web). */
export async function sharePersonalExport(
  data: CycleData,
  format: 'json' | 'csv',
): Promise<void> {
  const body =
    format === 'json' ? buildPersonalExportJson(data) : buildPersonalExportCsv(data);
  const title =
    format === 'json'
      ? `floraison-export-${todayKey()}.json`
      : `floraison-export-${todayKey()}.csv`;

  try {
    await Share.share({ message: body, title });
    if (Platform.OS !== 'web') {
      await Sharing.isAvailableAsync().catch(() => false);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    await alertAsync('Export impossible', msg);
  }
}
