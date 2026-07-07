import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import type { CycleData } from '../types/cycle';
import { buildMedicalReportHtml } from './medicalReportPdf';
import { getPeriodStarts } from './cycleMath';

export async function exportMedicalReportPdf(
  data: CycleData,
  userEmail?: string,
): Promise<void> {
  if (getPeriodStarts(data).length === 0 && Object.keys(data).length === 0) {
    Alert.alert(
      'Rien à exporter',
      'Enregistrez au moins quelques jours de suivi avant de générer un rapport.',
    );
    return;
  }

  try {
    const html = buildMedicalReportHtml(data, userEmail);

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Export réussi', `PDF enregistré : ${uri}`);
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Partager le rapport médical',
      UTI: 'com.adobe.pdf',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    Alert.alert('Export impossible', msg);
  }
}
