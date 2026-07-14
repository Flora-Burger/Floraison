import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, FilePdf, Lock, Shield, SignOut, Trash } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { exportMedicalReportPdf } from '../lib/exportMedicalPdf';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import {
  applyNotificationPrefs,
  requestNotificationPermission,
} from '../lib/notifications';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../lib/notificationPrefs';
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
  onDeleteAccount: () => Promise<void>;
};

export function SettingsTab({
  data,
  userEmail,
  pinEnabled,
  onPinEnable,
  onPinDisable,
  onLogout,
  onDeleteAccount,
}: SettingsTabProps) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    void loadNotificationPrefs().then((p) => {
      setNotifPrefs(p);
      setNotifLoading(false);
    });
  }, []);

  const updateNotifPrefs = useCallback(
    async (next: NotificationPrefs) => {
      setNotifPrefs(next);
      await saveNotificationPrefs(next);
      await applyNotificationPrefs(next, data);
    },
    [data],
  );

  const handleDailyToggle = async (enabled: boolean) => {
    if (enabled && Platform.OS !== 'web') {
      const ok = await requestNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Notifications désactivées',
          'Autorisez les notifications dans les réglages de votre téléphone pour recevoir des rappels.',
        );
        return;
      }
    }
    await updateNotifPrefs({ ...notifPrefs, dailyEnabled: enabled });
  };

  const handlePeriodToggle = async (enabled: boolean) => {
    if (enabled && Platform.OS !== 'web') {
      const ok = await requestNotificationPermission();
      if (!ok) {
        Alert.alert(
          'Notifications désactivées',
          'Autorisez les notifications dans les réglages de votre téléphone.',
        );
        return;
      }
    }
    await updateNotifPrefs({ ...notifPrefs, periodEnabled: enabled });
  };

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

  const runDeleteAccount = async () => {
    setDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action efface définitivement votre compte, toutes vos données de cycle et vos notes de journal. Elle est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Confirmez-vous la suppression définitive de votre compte et de toutes vos données ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer tout',
                  style: 'destructive',
                  onPress: () => void runDeleteAccount(),
                },
              ],
            );
          },
        },
      ],
    );
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

        {Platform.OS !== 'web' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rappels</Text>
            <View style={styles.settingCard}>
              <View style={[styles.iconWrap, { backgroundColor: ROSE + '22' }]}>
                <Bell size={ICON_SIZES.header} weight="duotone" color={ROSE_DEEP} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Rappel quotidien</Text>
                <Text style={styles.settingDesc}>
                  Chaque jour à {notifPrefs.dailyHour}h — « Comment tu te sens aujourd'hui ? »
                </Text>
              </View>
              {notifLoading ? (
                <ActivityIndicator color={ROSE} />
              ) : (
                <Switch
                  value={notifPrefs.dailyEnabled}
                  onValueChange={(v) => void handleDailyToggle(v)}
                  trackColor={{ false: BORDER, true: ROSE }}
                  thumbColor="#FFFCF9"
                />
              )}
            </View>
            <View style={styles.settingCard}>
              <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
                <Bell size={ICON_SIZES.header} weight="fill" color={ROSE_DEEP} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Avant tes règles</Text>
                <Text style={styles.settingDesc}>
                  {notifPrefs.periodDaysBefore} jours avant la date prévue
                </Text>
              </View>
              {notifLoading ? (
                <ActivityIndicator color={ROSE} />
              ) : (
                <Switch
                  value={notifPrefs.periodEnabled}
                  onValueChange={(v) => void handlePeriodToggle(v)}
                  trackColor={{ false: BORDER, true: ROSE }}
                  thumbColor="#FFFCF9"
                />
              )}
            </View>
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
          style={styles.actionCard}
          onPress={() => setPrivacyOpen(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
            <Shield size={ICON_SIZES.header} weight="fill" color={ROSE_DEEP} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Politique de confidentialité</Text>
            <Text style={styles.actionDesc}>
              Données collectées, hébergement, vos droits RGPD et contact.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.deleteCard]}
          onPress={handleDeleteAccount}
          disabled={deleting || !userEmail}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: ROSE + '18' }]}>
            {deleting ? (
              <ActivityIndicator color={ROSE_DEEP} />
            ) : (
              <Trash size={ICON_SIZES.header} weight="fill" color={ROSE_DEEP} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.deleteTitle}>Supprimer mon compte et mes données</Text>
            <Text style={styles.actionDesc}>
              Efface définitivement votre compte et l&apos;historique de suivi sur nos serveurs.
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

        <Text style={styles.disclaimer}>
          Floraison ne remplace pas un avis médical. Consulte un professionnel de santé en cas de
          douleur intense, saignement inhabituel ou cycle très irrégulier.
        </Text>
      </ScrollView>

      <PinSetupModal
        visible={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onComplete={(pin) => void onPinEnable(pin)}
      />
      <PrivacyPolicyScreen visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
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
  section: { marginBottom: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
    paddingHorizontal: 16,
    marginBottom: 8,
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
  deleteCard: {
    borderColor: ROSE + '44',
    backgroundColor: ROSE + '08',
  },
  deleteTitle: { fontSize: 16, fontWeight: '700', color: ROSE_DEEP, marginBottom: 4 },
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
  disclaimer: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    textAlign: 'center',
  },
});
