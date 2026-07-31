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
import { Bell, DownloadSimple, FilePdf, FirstAidKit, Lock, Shield, SignOut, Trash, Compass, AirplaneTilt } from 'phosphor-react-native';
import type { CycleData } from '../types/cycle';
import { exportMedicalReportPdf } from '../lib/exportMedicalPdf';
import { sharePersonalExport } from '../lib/exportPersonalData';
import { confirmAsync } from '../lib/confirmDialog';
import { todayKey } from '../lib/dates';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { DoctorBriefModal } from './DoctorBriefModal';
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
import { type PredictionPrefs } from '../lib/predictionPrefs';
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
  onLogout: () => void | Promise<void>;
  onDeleteAccount: () => Promise<void>;
  predPrefs: PredictionPrefs;
  onPredPrefsChange: (prefs: PredictionPrefs) => void;
};

export function SettingsTab({
  data,
  userEmail,
  pinEnabled,
  onPinEnable,
  onPinDisable,
  onLogout,
  onDeleteAccount,
  predPrefs,
  onPredPrefsChange,
}: SettingsTabProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingPersonal, setExportingPersonal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);
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

  const handlePersonalExport = async (format: 'json' | 'csv') => {
    setExportingPersonal(true);
    try {
      await sharePersonalExport(data, format);
    } finally {
      setExportingPersonal(false);
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      setPinModalOpen(true);
      return;
    }
    void (async () => {
      const ok = await confirmAsync(
        'Désactiver le code PIN',
        "Vous n'aurez plus à saisir de code au démarrage de l'application.",
        'Désactiver',
        true,
      );
      if (ok) await onPinDisable();
    })();
  };

  const handleLogout = () => {
    void (async () => {
      const ok = await confirmAsync(
        'Déconnexion',
        'Voulez-vous vous déconnecter ?',
        'Déconnexion',
        true,
      );
      if (ok) await onLogout();
    })();
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
    void (async () => {
      const step1 = await confirmAsync(
        'Supprimer mon compte',
        'Cette action efface définitivement votre compte, toutes vos données de cycle et vos notes de journal. Elle est irréversible.',
        'Continuer',
        true,
      );
      if (!step1) return;

      const step2 = await confirmAsync(
        'Confirmation finale',
        'Confirmez-vous la suppression définitive de votre compte et de toutes vos données ?',
        'Supprimer tout',
        true,
      );
      if (step2) await runDeleteAccount();
    })();
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
                  Vers {notifPrefs.dailyHour}h si tu n’as rien noté — « Ta plante t’attend… »
                </Text>
                {notifPrefs.dailyEnabled ? (
                  <View style={styles.chipRow}>
                    {[19, 20, 21, 22].map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.prefChip,
                          notifPrefs.dailyHour === h && styles.prefChipOn,
                        ]}
                        onPress={() => void updateNotifPrefs({ ...notifPrefs, dailyHour: h })}
                        accessibilityRole="button"
                        accessibilityState={{ selected: notifPrefs.dailyHour === h }}
                        accessibilityLabel={`Rappel à ${h} heures`}
                      >
                        <Text
                          style={[
                            styles.prefChipText,
                            notifPrefs.dailyHour === h && styles.prefChipTextOn,
                          ]}
                        >
                          {h}h
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
              {notifLoading ? (
                <ActivityIndicator color={ROSE} />
              ) : (
                <Switch
                  value={notifPrefs.dailyEnabled}
                  onValueChange={(v) => void handleDailyToggle(v)}
                  trackColor={{ false: BORDER, true: ROSE }}
                  thumbColor="#FFFCF9"
                  accessibilityLabel="Activer le rappel quotidien"
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
                  {notifPrefs.periodDaysBefore} jour
                  {notifPrefs.periodDaysBefore > 1 ? 's' : ''} avant la date prévue
                </Text>
                {notifPrefs.periodEnabled ? (
                  <View style={styles.chipRow}>
                    {[1, 2, 3].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.prefChip,
                          notifPrefs.periodDaysBefore === d && styles.prefChipOn,
                        ]}
                        onPress={() =>
                          void updateNotifPrefs({ ...notifPrefs, periodDaysBefore: d })
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: notifPrefs.periodDaysBefore === d }}
                        accessibilityLabel={`${d} jour${d > 1 ? 's' : ''} avant`}
                      >
                        <Text
                          style={[
                            styles.prefChipText,
                            notifPrefs.periodDaysBefore === d && styles.prefChipTextOn,
                          ]}
                        >
                          {d} j
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
              {notifLoading ? (
                <ActivityIndicator color={ROSE} />
              ) : (
                <Switch
                  value={notifPrefs.periodEnabled}
                  onValueChange={(v) => void handlePeriodToggle(v)}
                  trackColor={{ false: BORDER, true: ROSE }}
                  thumbColor="#FFFCF9"
                  accessibilityLabel="Activer le rappel avant les règles"
                />
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle</Text>
          <View style={styles.settingCard}>
            <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
              <AirplaneTilt size={ICON_SIZES.header} weight="duotone" color={ROSE_DEEP} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Jour local (voyage)</Text>
              <Text style={styles.settingDesc}>
                Les jours suivent le calendrier de ton téléphone. Aujourd’hui côté appareil :{' '}
                {todayKey()}. En voyage, change le fuseau du téléphone — Floraison suit.
              </Text>
            </View>
          </View>
          <View style={styles.settingCard}>
            <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
              <Compass size={ICON_SIZES.header} weight="duotone" color={ROSE_DEEP} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Mettre les prédictions en pause</Text>
              <Text style={styles.settingDesc}>
                Voyage, stress, cycle irrégulier… le calendrier n’affiche plus les jours prévus.
                (Les cycles très irréguliers activent déjà un mode doux automatique.)
              </Text>
            </View>
            <Switch
              value={predPrefs.pausePredictions}
              onValueChange={(v) => onPredPrefsChange({ pausePredictions: v })}
              trackColor={{ false: BORDER, true: ROSE }}
              thumbColor="#FFFCF9"
              accessibilityLabel="Mettre les prédictions en pause"
            />
          </View>
        </View>

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
            accessibilityLabel="Activer le code PIN au démarrage"
          />
        </View>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setDoctorOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir le résumé pour mon médecin"
        >
          <View style={[styles.iconWrap, { backgroundColor: ROSE + '22' }]}>
            <FirstAidKit size={ICON_SIZES.header} weight="duotone" color={ROSE_DEEP} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Pour mon médecin</Text>
            <Text style={styles.actionDesc}>
              Résumé en 3 lignes + export PDF de ton suivi
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Exporter le rapport PDF"
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
          onPress={() => void handlePersonalExport('json')}
          disabled={exportingPersonal}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Exporter mes données en JSON"
        >
          <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
            {exportingPersonal ? (
              <ActivityIndicator color={ROSE_DEEP} />
            ) : (
              <DownloadSimple size={ICON_SIZES.header} weight="bold" color={ROSE_DEEP} />
            )}
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Export perso (JSON)</Text>
            <Text style={styles.actionDesc}>
              Toutes tes journées — pour toi seulement, via la feuille de partage.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => void handlePersonalExport('csv')}
          disabled={exportingPersonal}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Exporter mes données en CSV"
        >
          <View style={[styles.iconWrap, { backgroundColor: SAGE_LIGHT + '55' }]}>
            <DownloadSimple size={ICON_SIZES.header} weight="duotone" color={ROSE_DEEP} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Export perso (CSV)</Text>
            <Text style={styles.actionDesc}>
              Tableau simple à ouvrir dans un tableur — usage privé.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setPrivacyOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Politique de confidentialité"
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
          accessibilityRole="button"
          accessibilityLabel="Supprimer mon compte et mes données"
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
          accessibilityRole="button"
          accessibilityLabel="Déconnexion"
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
      <DoctorBriefModal
        visible={doctorOpen}
        data={data}
        onClose={() => setDoctorOpen(false)}
        onExportPdf={() => {
          setDoctorOpen(false);
          void handleExport();
        }}
        exporting={exporting}
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  prefChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_SOFT,
  },
  prefChipOn: {
    backgroundColor: ROSE,
    borderColor: ROSE,
  },
  prefChipText: { fontSize: 12, fontWeight: '700', color: TEXT },
  prefChipTextOn: { color: '#FFFCF9' },
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
