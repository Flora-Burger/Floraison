import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FilePdf, Lock, SignOut } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { exportMedicalReportPdf } from '../lib/exportMedicalPdf';
import { PinSetupModal } from './PinSetupModal';
import {
  BG_SOFT,
  BORDER,
  CARD,
  MUTED,
  ROSE,
  ROSE_DEEP,
  SAGE_LIGHT,
  TEXT,
  ICON_SIZES,
} from '../constants/theme';

type SettingsTabProps = {
  data: CycleData;
  userEmail?: string;
  pinEnabled: boolean;
  onPinEnable: (pin: string) => Promise<void>;
  onPinDisable: () => Promise<void>;
  onLogout: () => void;
};

export function SettingsTab({
  data,
  userEmail,
  pinEnabled,
  onPinEnable,
  onPinDisable,
  onLogout,
}: SettingsTabProps) {
  const [exporting, setExporting] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportMedicalReportPdf(data, userEmail);
    } finally {
      setExporting(false);
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      setPinModalOpen(true);
      return;
    }
    Alert.alert(
      'Désactiver le code PIN',
      "Vous n'aurez plus à saisir de code au démarrage de l'application.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: () => void onPinDisable(),
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <>
      <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        <Text style={styles.intro}>Les paramètres</Text>

        {userEmail ? (
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>Compte connecté</Text>
            <Text style={styles.accountEmail}>{userEmail}</Text>
          </View>
        ) : null}

        <View style={styles.settingCard}>
          <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
            <Lock size={ICON_SIZES.header} weight={pinEnabled ? 'fill' : 'regular'} color={ROSE_DEEP} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Code PIN au démarrage</Text>
            <Text style={styles.settingDesc}>
              {pinEnabled
                ? 'Un code à 4 chiffres est demandé à l\'ouverture de l\'app.'
                : 'Aucun code requis à l\'ouverture.'}
            </Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: BORDER, true: ROSE }}
            thumbColor="#FFFCF9"
          />
        </View>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: ROSE + '22' }]}>
            {exporting ? (
              <ActivityIndicator color={ROSE_DEEP} />
            ) : (
              <FilePdf size={ICON_SIZES.header} weight="fill" color={ROSE_DEEP} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Exporter en PDF</Text>
            <Text style={styles.actionDesc}>
              Rapport clair pour votre médecin ou gynécologue : cycles, symptômes et tendances.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.logoutCard]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: BG_SOFT }]}>
            <SignOut size={ICON_SIZES.header} weight="regular" color={MUTED} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Déconnexion</Text>
            <Text style={styles.actionDesc}>Fermer la session sur cet appareil.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <PinSetupModal
        visible={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onComplete={(pin) => void onPinEnable(pin)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1 },
  tabContent: { paddingBottom: 24 },
  intro: {
    fontSize: 20,
    fontWeight: '700',
    color: ROSE_DEEP,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  accountCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: BG_SOFT,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SAGE_LIGHT,
  },
  accountLabel: { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 4 },
  accountEmail: { fontSize: 14, color: TEXT, fontWeight: '500' },
  settingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 4 },
  settingDesc: { fontSize: 13, color: MUTED, lineHeight: 19 },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoutCard: { marginTop: 4 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginBottom: 4 },
  actionDesc: { fontSize: 13, color: MUTED, lineHeight: 19 },
});
