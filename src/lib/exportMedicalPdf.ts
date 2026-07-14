import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import type { CycleData } from '../types/cycle';
import { buildMedicalReportHtml } from './medicalReportPdf';
import { getPeriodStarts } from './cycleMath';

/** A4 @ 96 DPI — rendu PDF plus lisible sur mobile. */
const PDF_WIDTH = 794;
const PDF_HEIGHT = 1123;

function exportPdfOnWeb(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Rapport Floraison');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${PDF_WIDTH}px`;
  iframe.style.height = `${PDF_HEIGHT}px`;
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Impossible de préparer le rapport.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  const printFromIframe = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1000);
    }
  };

  if (iframe.contentWindow?.document.readyState === 'complete') {
    window.setTimeout(printFromIframe, 250);
  } else {
    iframe.onload = () => window.setTimeout(printFromIframe, 250);
  }

  Alert.alert(
    'Exporter le rapport',
    'Choisissez « Enregistrer au format PDF » ou une imprimante PDF dans la fenêtre qui s\'ouvre.',
  );
}

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
      exportPdfOnWeb(html);
      return;
    }

    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: PDF_WIDTH,
      height: PDF_HEIGHT,
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
