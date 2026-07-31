import { Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FilePdf, FirstAidKit, X } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { formatDoctorBrief, getCycleThreeLineSummary } from '../lib/cycleSummary';
import { todayKey } from '../lib/dates';
import { BG, BG_SOFT, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';
import { useMemo } from 'react';

type DoctorBriefModalProps = {
  visible: boolean;
  data: CycleData;
  onClose: () => void;
  onExportPdf: () => void;
  exporting?: boolean;
};

export function DoctorBriefModal({
  visible,
  data,
  onClose,
  onExportPdf,
  exporting,
}: DoctorBriefModalProps) {
  const summary = useMemo(() => getCycleThreeLineSummary(data, todayKey()), [data]);
  const brief = useMemo(() => formatDoctorBrief(data), [data]);

  const handleShareText = async () => {
    try {
      await Share.share({ message: brief, title: 'Résumé Floraison' });
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FirstAidKit size={22} weight="duotone" color={ROSE_DEEP} />
              <Text style={styles.title}>Pour mon médecin</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fermer">
              <X size={22} color={MUTED} />
            </TouchableOpacity>
          </View>
          <Text style={styles.intro}>
            Résumé factuel de ton suivi — à partager ou exporter en PDF. Ce n’est pas un diagnostic.
          </Text>
          {summary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.line}>{summary.line1}</Text>
              <Text style={styles.line}>{summary.line2}</Text>
              <Text style={styles.line}>{summary.line3}</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Pas encore assez de données pour un résumé.</Text>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={onExportPdf} disabled={exporting}>
            <FilePdf size={18} color="#FFFCF9" weight="bold" />
            <Text style={styles.primaryBtnText}>
              {exporting ? 'Export…' : 'Exporter le PDF complet'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => void handleShareText()}>
            <Text style={styles.secondaryBtnText}>Partager le résumé texte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(40,30,35,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT },
  intro: { fontSize: 13, color: MUTED, lineHeight: 19, marginBottom: 14 },
  summaryBox: {
    backgroundColor: BG_SOFT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 16,
  },
  line: { fontSize: 14, color: TEXT, lineHeight: 21, marginBottom: 6 },
  empty: { fontSize: 13, color: MUTED, marginBottom: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ROSE,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  primaryBtnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_SOFT,
  },
  secondaryBtnText: { color: ROSE_DEEP, fontWeight: '700', fontSize: 14 },
});
