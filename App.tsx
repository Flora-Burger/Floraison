import 'react-native-url-polyfill/auto';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session } from '@supabase/supabase-js';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { BookOpen, Drop } from 'phosphor-react-native';
import { CorpsTab } from './src/components/CorpsTab';
import { InsightsTab } from './src/components/InsightsTab';
import { CalendarTrackingLegend } from './src/components/CalendarTrackingLegend';
import { PinPad } from './src/components/PinPad';
import { SettingsTab } from './src/components/SettingsTab';
import { PrivacyPolicyScreen } from './src/components/PrivacyPolicyScreen';
import { PasswordResetScreen } from './src/components/PasswordResetScreen';
import { getEmailConfirmRedirectUri, getPasswordResetRedirectUri } from './src/lib/authRedirect';
import { deleteUserAccount } from './src/lib/accountDeletion';
import { handleAuthDeepLink } from './src/lib/authDeepLink';
import { NAV_TABS, TabIcon, type TabId } from './src/components/TabIcon';
import {
  BG,
  BG_SOFT,
  BORDER,
  CARD,
  FERTILITY,
  LAVENDER,
  MUTED,
  OVULATION_BG,
  OVULATION_RING,
  PERIOD_FLOW,
  ROSE,
  ROSE_DEEP,
  SAGE,
  SAGE_LIGHT,
  TEXT,
  ICON_SIZES,
  TRACK_COLORS,
} from './src/constants/theme';
import {
  CRAVING_OPTIONS,
  DISCHARGE_OPTIONS,
  FLOW_OPTIONS,
  MOOD_OPTIONS,
  PHYSICAL_OPTIONS,
  SEXUAL_OPTIONS,
  SKIN_OPTIONS,
  SLEEP_OPTIONS,
  TRACK_CATEGORY_TINTS,
} from './src/constants/symptoms';
import { addDays, parseDateKey, todayKey } from './src/lib/dates';
import {
  computeAvgCycleLength,
  computeAvgPeriodDays,
  computeOvulationDate,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_DAYS,
  findLastPeriodStart,
  getFertilityWindowDates,
  getPeriodStarts,
} from './src/lib/cycleMath';
import {
  applyDayPatch,
  migrateCycleData,
  toggleMulti,
} from './src/lib/dayEntry';
import { syncAllReminders } from './src/lib/notifications';
import { isEmptyDayEntry } from './src/lib/cycleInsights';
import { getStoredPin, removeStoredPin, setStoredPin as persistPin } from './src/lib/pinStorage';
import type {
  CycleData,
  DayEntry,
  Flow,
  FoodCraving,
  MoodTag,
  PhysicalSymptom,
  SexualActivity,
  Skin,
  SleepQuality,
  Discharge,
} from './src/types/cycle';

LocaleConfig.locales.fr = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ],
  monthNamesShort: [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
  ],
  dayNames: [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi',
  ],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

// ─── Storage keys ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

type AppPhase = 'loading' | 'pin' | 'auth' | 'reset-password' | 'main';

type AuthMode = 'login' | 'signup';

const CALENDAR_DAY_SIZE = 32;
const CALENDAR_DAY_RADIUS = CALENDAR_DAY_SIZE / 2;
const CALENDAR_DOT_SIZE = 5;
/** Espace autour du cercle pour les points sur le contour. */
const CALENDAR_RING_SIZE = CALENDAR_DAY_SIZE + CALENDAR_DOT_SIZE + 4;
const CALENDAR_RING_CENTER = CALENDAR_RING_SIZE / 2;
const CALENDAR_DOT_ORBIT = CALENDAR_DAY_RADIUS + CALENDAR_DOT_SIZE / 2;

function getContourDotPositions(count: number): { left: number; top: number }[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    return {
      left: CALENDAR_RING_CENTER + CALENDAR_DOT_ORBIT * Math.cos(angle) - CALENDAR_DOT_SIZE / 2,
      top: CALENDAR_RING_CENTER + CALENDAR_DOT_ORBIT * Math.sin(angle) - CALENDAR_DOT_SIZE / 2,
    };
  });
}

/** Points colorés sous chaque jour du calendrier (une couleur par catégorie renseignée). */
function getTrackingDotColors(entry: DayEntry | undefined): string[] {
  if (!entry) return [];
  const dots: string[] = [];
  if (entry.discharge?.length) dots.push(TRACK_COLORS.discharge);
  if (entry.physical?.length) dots.push(TRACK_COLORS.physical);
  if (entry.skin?.length) dots.push(TRACK_COLORS.skin);
  if (entry.mood?.length) dots.push(TRACK_COLORS.mood);
  if (entry.sleep?.length) dots.push(TRACK_COLORS.sleep);
  if (entry.cravings?.length) dots.push(TRACK_COLORS.cravings);
  if (entry.sexual?.length) dots.push(TRACK_COLORS.sexual);
  return dots;
}

function TrackingCalendarDay({
  date,
  state,
  marking,
  onPress,
  entry,
}: {
  date: DateData;
  state: string;
  marking?: { customStyles?: { container?: object; text?: object } };
  onPress?: (d: DateData) => void;
  entry?: DayEntry;
}) {
  const containerStyle = marking?.customStyles?.container;
  const textStyle = marking?.customStyles?.text;
  const dots = getTrackingDotColors(entry);
  const isDisabled = state === 'disabled';
  const isToday = state === 'today';

  const dotPositions = getContourDotPositions(dots.length);

  return (
    <View style={styles.calendarDayWrapper}>
      <View style={styles.calendarDayRing}>
        <TouchableOpacity
          style={[
            styles.calendarDayCell,
            isToday && !containerStyle && styles.calendarDayToday,
            containerStyle,
          ]}
          onPress={() => onPress?.(date)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.calendarDayText,
              textStyle,
              isDisabled && styles.calendarDayTextDisabled,
            ]}
          >
            {date.day}
          </Text>
        </TouchableOpacity>
        {dots.map((color, index) => (
          <View
            key={`${color}-${index}`}
            style={[
              styles.calendarDayDot,
              dotPositions[index],
              { backgroundColor: color },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function periodDayStyle(flow: Flow | undefined, predicted: boolean) {
  const bg = predicted
    ? PERIOD_FLOW.predicted
    : flow
      ? PERIOD_FLOW[flow]
      : PERIOD_FLOW.default;
  return {
    customStyles: {
      container: {
        backgroundColor: bg,
        borderRadius: CALENDAR_DAY_RADIUS,
        ...(predicted ? { borderWidth: 1, borderColor: ROSE + '44' } : {}),
      },
      text: {
        color: predicted || flow === 'leger' ? TEXT : '#FFFCF9',
        fontWeight: '600' as const,
      },
    },
  };
}

function fertilityDayStyle() {
  return {
    customStyles: {
      container: {
        backgroundColor: FERTILITY + '55',
        borderRadius: CALENDAR_DAY_RADIUS,
      },
      text: { color: TEXT, fontWeight: '500' as const },
    },
  };
}

/** Jour d'ovulation : anneau doré type pétales autour du bleu ciel. */
function ovulationDayStyle() {
  return {
    customStyles: {
      container: {
        backgroundColor: OVULATION_BG,
        borderRadius: CALENDAR_DAY_RADIUS,
        borderWidth: 2.5,
        borderColor: OVULATION_RING,
      },
      text: { color: TEXT, fontWeight: '800' as const, fontSize: 15 },
    },
  };
}

function buildMarkedDates(data: CycleData, selected: string) {
  const marked: Record<string, object> = {};
  const cycleLength = computeAvgCycleLength(data);
  const periodDays = computeAvgPeriodDays(data);

  for (const [date, entry] of Object.entries(data)) {
    if (entry.period) {
      marked[date] = periodDayStyle(entry.flow, false);
    }
  }

  const lastStart = findLastPeriodStart(data);
  if (lastStart) {
    for (let cycle = 0; cycle <= 3; cycle++) {
      const cycleStart = addDays(lastStart, cycle * cycleLength);
      for (let d = 0; d < periodDays; d++) {
        const date = addDays(cycleStart, d);
        if (!data[date]?.period) {
          marked[date] = periodDayStyle(undefined, true);
        }
      }
      const ovulation = computeOvulationDate(cycleStart, cycleLength);
      const fertilityDates = getFertilityWindowDates(cycleStart, cycleLength);
      for (const date of fertilityDates) {
        if (data[date]?.period) continue;
        if (date === ovulation) {
          marked[date] = ovulationDayStyle();
        } else if (!marked[date]) {
          marked[date] = fertilityDayStyle();
        }
      }
    }
  }

  if (selected) {
    const prev = marked[selected] as { customStyles?: object } | undefined;
    marked[selected] = {
      ...prev,
      customStyles: {
        ...(prev?.customStyles ?? {}),
        container: {
          ...((prev?.customStyles as { container?: object })?.container ?? {}),
          borderWidth: 2.5,
          borderColor: SAGE,
          borderRadius: CALENDAR_DAY_RADIUS,
        },
      },
    };
  }

  return marked;
}

// ─── Supabase helpers ───────────────────────────────────────────────────────
async function loadCycleData(userId: string): Promise<CycleData> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('cycle_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await ensureCycleDataRow(userId);
    return {};
  }
  return migrateCycleData((data.data as CycleData) ?? {});
}

async function saveCycleData(userId: string, cycleData: CycleData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('cycle_data').upsert(
    {
      user_id: userId,
      data: cycleData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

async function ensureCycleDataRow(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('cycle_data').upsert(
    {
      user_id: userId,
      data: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

function formatAuthError(e: unknown): string {
  const msg =
    e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
      ? e.message
      : '';

  if (msg.includes('Email not confirmed')) {
    return 'Email non confirmé. Ouvrez le lien reçu par mail (vérifiez les spams), puis reconnectez-vous.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (msg.includes('rate limit') || msg.includes('12 seconds') || msg.includes('56 seconds')) {
    return 'Trop de tentatives. Attendez une minute avant de réessayer.';
  }
  if (msg.includes('User already registered')) {
    return 'Un compte existe déjà avec cet email. Connectez-vous ou confirmez votre email.';
  }
  if (msg.includes('Network request failed')) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet et la configuration Supabase (.env), puis redémarrez Expo.';
  }
  return msg || 'Erreur de connexion';
}

// ─── PIN Screen ─────────────────────────────────────────────────────────────
function PinScreen({
  title,
  onPinEntered,
  error,
  resetKey,
}: {
  title: string;
  onPinEntered: (pin: string) => void;
  error?: string;
  resetKey?: string;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pinContainer}>
        <PinPad
          title={title}
          subtitle="Protection locale — jamais envoyé au serveur"
          onComplete={onPinEntered}
          error={error}
          resetKey={resetKey}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleForgotPassword = async () => {
    if (!supabase) {
      setError('Supabase non configuré. Ajoutez vos clés dans .env');
      return;
    }
    if (!email.trim()) {
      setError('Entrez votre adresse email pour recevoir le lien de réinitialisation.');
      return;
    }
    setResetLoading(true);
    setError('');
    setInfo('');
    try {
      const redirectTo = getPasswordResetRedirectUri();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) {
        setError(formatAuthError(resetError));
        return;
      }
      setInfo(
        'Un email vous a été envoyé. Ouvrez le lien sur ce téléphone : il ouvrira Floraison pour choisir un nouveau mot de passe.',
      );
    } catch (e: unknown) {
      setError(formatAuthError(e));
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!supabase) {
      setError('Supabase non configuré. Ajoutez vos clés dans .env');
      return;
    }
    if (!email.trim()) {
      setError('Entrez votre adresse email pour renvoyer le lien de confirmation.');
      return;
    }
    setResendLoading(true);
    setError('');
    setInfo('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: getEmailConfirmRedirectUri() },
      });
      if (resendError) {
        setError(formatAuthError(resendError));
        return;
      }
      setInfo(
        'Email de confirmation renvoyé. Ouvrez le lien sur ce téléphone ou cet ordinateur, puis reconnectez-vous.',
      );
    } catch (e: unknown) {
      setError(formatAuthError(e));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!supabase) {
      setError('Supabase non configuré. Ajoutez vos clés dans .env');
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError('Email requis et mot de passe d\'au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          setError(formatAuthError(authError));
          return;
        }
        if (data.session) onSuccess(data.session);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getEmailConfirmRedirectUri(),
          },
        });
        if (authError) {
          setError(formatAuthError(authError));
          return;
        }
        if (data.session) {
          await ensureCycleDataRow(data.session.user.id);
          onSuccess(data.session);
        } else {
          setError(
            'Compte créé ! Un email de confirmation vous a été envoyé. Cliquez sur le lien, puis revenez vous connecter.',
          );
        }
      }
    } catch (e: unknown) {
      setError(formatAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.authContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.authTitle}>{mode === 'login' ? 'Connexion' : 'Inscription'}</Text>
        <Text style={styles.authSubtitle}>Synchronisez vos données en toute sécurité</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={MUTED}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={MUTED}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.pinError}>{error}</Text> : null}
        {info ? <Text style={styles.authInfo}>{info}</Text> : null}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Text>
          )}
        </TouchableOpacity>
        {mode === 'login' ? (
          <>
            <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading}>
              <Text style={styles.linkText}>
                {resetLoading ? 'Envoi en cours…' : 'Mot de passe oublié ?'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendConfirmation} disabled={resendLoading}>
              <Text style={styles.linkText}>
                {resendLoading ? 'Envoi en cours…' : 'Renvoyer l\'email de confirmation'}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
            setInfo('');
          }}
        >
          <Text style={styles.linkText}>
            {mode === 'login'
              ? "Pas encore de compte ? S'inscrire"
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPrivacyOpen(true)} style={styles.authPrivacyLink}>
          <Text style={styles.authPrivacyText}>Politique de confidentialité</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <PrivacyPolicyScreen visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </SafeAreaView>
  );
}

// ─── Chip button ────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onPress,
  tint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected &&
          (tint
            ? { backgroundColor: tint + '28', borderColor: tint, borderWidth: 1.5 }
            : styles.chipSelected),
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Day Form ───────────────────────────────────────────────────────────────
function DayForm({
  date,
  entry,
  onChange,
}: {
  date: string;
  entry: DayEntry;
  onChange: (patch: Partial<DayEntry>) => void;
}) {
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState(entry.journal ?? '');

  useEffect(() => {
    setJournalDraft(entry.journal ?? '');
  }, [date, entry.journal]);

  const togglePhysical = (id: PhysicalSymptom) =>
    onChange({ physical: toggleMulti(entry.physical, id) });
  const toggleMood = (id: MoodTag) => onChange({ mood: toggleMulti(entry.mood, id) });
  const toggleCraving = (id: FoodCraving) =>
    onChange({ cravings: toggleMulti(entry.cravings, id) });
  const toggleSexual = (id: SexualActivity) =>
    onChange({ sexual: toggleMulti(entry.sexual, id) });
  const toggleDischarge = (id: Discharge) =>
    onChange({ discharge: toggleMulti(entry.discharge, id) });
  const toggleSkin = (id: Skin) => onChange({ skin: toggleMulti(entry.skin, id) });
  const toggleSleep = (id: SleepQuality) => onChange({ sleep: toggleMulti(entry.sleep, id) });

  const handleJournal = (text: string) => {
    onChange({ journal: text });
  };

  const openJournal = () => {
    setJournalDraft(entry.journal ?? '');
    setJournalModalOpen(true);
  };

  const saveJournal = () => {
    handleJournal(journalDraft);
    setJournalModalOpen(false);
  };

  const d = parseDateKey(date);
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  const month = d.toLocaleDateString('fr-FR', { month: 'long' });
  const dayNum = d.getDate();
  const hasJournal = !!(entry.journal && entry.journal.trim());
  return (
    <View style={styles.card}>
      <View style={styles.floralCardAccent} />
      <View style={styles.dateHeader}>
        <View style={styles.dateHeaderMain}>
          <Text style={styles.dateWeekday}>{weekday}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateDayNum}>{dayNum}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.journalBtn, hasJournal && styles.journalBtnActive]}
          onPress={openJournal}
        >
          <BookOpen
            size={ICON_SIZES.card}
            weight={hasJournal ? 'fill' : 'regular'}
            color={hasJournal ? ROSE_DEEP : MUTED}
          />
          <Text style={[styles.journalBtnLabel, hasJournal && styles.journalBtnLabelActive]}>
            Journal
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={journalModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setJournalModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setJournalModalOpen(false)} />
          <View style={styles.journalModal}>
            <View style={styles.journalModalHeader}>
              <Text style={styles.journalModalTitle}>Journal intime</Text>
              <TouchableOpacity onPress={() => setJournalModalOpen(false)}>
                <Text style={styles.journalModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.journalModalDate}>
              {weekday} {dayNum} {month}
            </Text>
            <TextInput
              style={styles.journalModalInput}
              multiline
              placeholder="Comment vous sentez-vous aujourd'hui ?"
              placeholderTextColor={MUTED}
              value={journalDraft}
              onChangeText={setJournalDraft}
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity style={styles.journalModalSave} onPress={saveJournal}>
              <Text style={styles.journalModalSaveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.sectionDivider} />

      <View style={styles.rowBetween}>
        <View style={styles.labelRow}>
          <Drop size={ICON_SIZES.card} weight="fill" color={ROSE} />
          <Text style={[styles.label, styles.labelInline]}>Règles aujourd'hui</Text>
        </View>
        <Switch
          value={!!entry.period}
          onValueChange={(v) => onChange({ period: v, ...(v ? {} : { flow: undefined }) })}
          trackColor={{ false: BORDER, true: ROSE }}
          thumbColor="#FFFCF9"
        />
      </View>

      {entry.period ? (
        <View style={styles.section}>
          <Text style={styles.label}>Flux</Text>
          <View style={styles.chipRow}>
            {FLOW_OPTIONS.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                selected={entry.flow === f.id}
                onPress={() => onChange({ flow: f.id })}
                tint={f.tint}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.label}>Pertes</Text>
        <View style={styles.chipRow}>
          {DISCHARGE_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.discharge ?? []).includes(opt.id)}
              onPress={() => toggleDischarge(opt.id)}
              tint={TRACK_CATEGORY_TINTS.discharge}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Symptômes physiques</Text>
        <View style={styles.chipRow}>
          {PHYSICAL_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.physical ?? []).includes(opt.id)}
              onPress={() => togglePhysical(opt.id)}
              tint={TRACK_CATEGORY_TINTS.physical}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Peau</Text>
        <View style={styles.chipRow}>
          {SKIN_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.skin ?? []).includes(opt.id)}
              onPress={() => toggleSkin(opt.id)}
              tint={TRACK_CATEGORY_TINTS.skin}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Humeur & émotions</Text>
        <View style={styles.chipRow}>
          {MOOD_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.mood ?? []).includes(opt.id)}
              onPress={() => toggleMood(opt.id)}
              tint={TRACK_CATEGORY_TINTS.mood}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Sommeil</Text>
        <View style={styles.chipRow}>
          {SLEEP_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.sleep ?? []).includes(opt.id)}
              onPress={() => toggleSleep(opt.id)}
              tint={TRACK_CATEGORY_TINTS.sleep}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Envies alimentaires</Text>
        <View style={styles.chipRow}>
          {CRAVING_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.cravings ?? []).includes(opt.id)}
              onPress={() => toggleCraving(opt.id)}
              tint={TRACK_CATEGORY_TINTS.cravings}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Libido & vie sexuelle</Text>
        <View style={styles.chipRow}>
          {SEXUAL_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={(entry.sexual ?? []).includes(opt.id)}
              onPress={() => toggleSexual(opt.id)}
              tint={TRACK_CATEGORY_TINTS.sexual}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Suivi Tab ──────────────────────────────────────────────────────────────
function SuiviTab({
  data,
  selectedDate,
  onSelectDate,
  onUpdateDay,
}: {
  data: CycleData;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  onUpdateDay: (date: string, patch: Partial<DayEntry>) => void;
}) {
  const markedDates = useMemo(() => buildMarkedDates(data, selectedDate), [data, selectedDate]);
  const cycleLength = useMemo(() => computeAvgCycleLength(data), [data]);
  const periodDays = useMemo(() => computeAvgPeriodDays(data), [data]);
  const hasHistory = getPeriodStarts(data).length >= 2;

  const entry = data[selectedDate] ?? {};

  const renderCalendarDay = useCallback(
    (props: {
      date?: DateData;
      state?: string;
      marking?: object;
      onPress?: (d: DateData) => void;
    }) => {
      if (!props.date) return <View style={styles.calendarDayWrapper} />;
      return (
        <TrackingCalendarDay
          date={props.date}
          state={props.state ?? ''}
          marking={props.marking as { customStyles?: { container?: object; text?: object } }}
          onPress={props.onPress}
          entry={data[props.date.dateString]}
        />
      );
    },
    [data],
  );

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => onSelectDate(day.dateString)}
          markingType="custom"
          markedDates={markedDates}
          dayComponent={renderCalendarDay as never}
          firstDay={1}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: MUTED,
            selectedDayBackgroundColor: SAGE,
            todayTextColor: ROSE_DEEP,
            todayBackgroundColor: SAGE_LIGHT + '55',
            dayTextColor: TEXT,
            textDisabledColor: BORDER,
            monthTextColor: TEXT,
            arrowColor: ROSE,
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontSize: 12,
            'stylesheet.day.basic': {
              base: {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: CALENDAR_RING_SIZE + 4,
              },
            },
          } as never}
          style={styles.calendar}
        />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PERIOD_FLOW.predicted, borderWidth: 1, borderColor: ROSE + '55' }]} />
          <Text style={styles.legendText}>Prévu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: FERTILITY + '88' }]} />
          <Text style={styles.legendText}>Fertilité</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: OVULATION_BG, borderWidth: 2, borderColor: OVULATION_RING }]} />
          <Text style={styles.legendText}>Ovulation</Text>
        </View>
      </View>
      <CalendarTrackingLegend />
      <Text style={styles.cycleHint}>
        {hasHistory
          ? `Prédictions : cycle ~${cycleLength} j · règles ~${periodDays} j`
          : `Prédictions : cycle ${DEFAULT_CYCLE_LENGTH} j · règles ${DEFAULT_PERIOD_DAYS} j (par défaut — saisissez 2 cycles pour personnaliser)`}
      </Text>
      <DayForm
        date={selectedDate}
        entry={entry}
        onChange={(patch) => onUpdateDay(selectedDate, patch)}
      />
    </ScrollView>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [cycleData, setCycleData] = useState<CycleData>({});
  const [activeTab, setActiveTab] = useState<TabId>('suivi');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [highlightTopicId, setHighlightTopicId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  const enterMainApp = useCallback(async () => {
    setPhase('main');
  }, []);

  const afterPinUnlock = useCallback(async () => {
    if (!supabase) {
      Alert.alert(
        'Configuration requise',
        'Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans un fichier .env',
      );
      setPhase('auth');
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession(data.session);
      setLoadingData(true);
      try {
        const loaded = await loadCycleData(data.session.user.id);
        setCycleData(loaded);
        await enterMainApp();
      } catch {
        setSyncError('Impossible de charger vos données.');
        await enterMainApp();
      } finally {
        setLoadingData(false);
      }
    } else {
      setPhase('auth');
    }
  }, [enterMainApp]);

  const handleLearnMore = useCallback((articleId: string) => {
    setHighlightTopicId(articleId);
    setActiveTab('corps');
  }, []);

  useEffect(() => {
    if (phase === 'main' && Object.keys(cycleData).length > 0) {
      void syncAllReminders(cycleData);
    }
  }, [cycleData, phase]);

  const completeAuthSession = useCallback(
    async (s: Session) => {
      setSession(s);
      setLoadingData(true);
      try {
        await ensureCycleDataRow(s.user.id);
        const loaded = await loadCycleData(s.user.id);
        setCycleData(loaded);
        await enterMainApp();
      } catch {
        setSyncError('Impossible de charger vos données.');
        await enterMainApp();
      } finally {
        setLoadingData(false);
      }
    },
    [enterMainApp],
  );

  const processAuthUrl = useCallback(
    async (url: string | null): Promise<boolean> => {
      if (!url || !supabase) return false;
      try {
        const result = await handleAuthDeepLink(supabase, url);
        if (result === 'recovery') {
          setPhase('reset-password');
          return true;
        }
        if (result === 'signup' || result === 'other') {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            await completeAuthSession(data.session);
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
            return true;
          }
        }
      } catch (e: unknown) {
        Alert.alert(
          'Lien invalide',
          e instanceof Error ? e.message : 'Impossible de traiter le lien reçu par email.',
        );
      }
      return false;
    },
    [completeAuthSession],
  );

  useEffect(() => {
    (async () => {
      let initialUrl = await Linking.getInitialURL();
      if (!initialUrl && Platform.OS === 'web' && typeof window !== 'undefined') {
        initialUrl = window.location.href;
      }
      if (await processAuthUrl(initialUrl)) return;

      const pin = await getStoredPin();
      setStoredPin(pin);
      if (pin) {
        setPhase('pin');
        return;
      }
      await afterPinUnlock();
    })();
  }, [afterPinUnlock, processAuthUrl]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      void processAuthUrl(url);
    });
    return () => sub.remove();
  }, [processAuthUrl]);

  const handlePinEntered = useCallback(
    async (pin: string) => {
      setPinError('');
      if (pin !== storedPin) {
        setPinError('Code incorrect.');
        return;
      }
      await afterPinUnlock();
    },
    [storedPin, afterPinUnlock],
  );

  const pinTitle = 'Entrez votre code PIN';

  const handleAuthSuccess = async (s: Session) => {
    await completeAuthSession(s);
  };

  const persistData = useCallback(
    async (next: CycleData) => {
      if (!session) return;
      try {
        await saveCycleData(session.user.id, next);
        setSyncError('');
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
            ? e.message
            : '';
        setSyncError(msg ? `Sauvegarde impossible : ${msg}` : 'Sauvegarde impossible — vérifiez votre connexion.');
      }
    },
    [session],
  );

  const updateDay = useCallback(
    (date: string, patch: Partial<DayEntry>) => {
      setCycleData((prev) => {
        const current = prev[date] ?? {};
        const merged = applyDayPatch(current, patch);
        const next = { ...prev };
        if (isEmptyDayEntry(merged)) {
          delete next[date];
        } else {
          next[date] = merged;
        }
        persistData(next);
        return next;
      });
    },
    [persistData],
  );

  const handleLogout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setCycleData({});
    setSyncError('');
    setPhase('auth');
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!supabase || !session) return;
    const result = await deleteUserAccount(supabase, session.user.id);
    setSession(null);
    setCycleData({});
    setStoredPin(null);
    setPhase('auth');
    if (result.ok) {
      Alert.alert(
        'Compte supprimé',
        'Votre compte et toutes vos données ont été effacés définitivement.',
      );
    } else {
      Alert.alert('Suppression', result.message);
    }
  }, [session]);

  const handlePinEnable = useCallback(async (pin: string) => {
    await persistPin(pin);
    setStoredPin(pin);
    Alert.alert('Code PIN activé', 'Un code sera demandé à chaque ouverture de l\'application.');
  }, []);

  const handlePinDisable = useCallback(async () => {
    await removeStoredPin();
    setStoredPin(null);
    Alert.alert('Code PIN désactivé', 'Vous pouvez ouvrir l\'application sans code.');
  }, []);

  const pinEnabled = storedPin !== null;

  const handlePasswordResetSubmit = useCallback(async (password: string): Promise<string | null> => {
    if (!supabase) return 'Supabase non configuré.';
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return formatAuthError(error);
    await supabase.auth.signOut();
    Alert.alert(
      'Mot de passe mis à jour',
      'Votre mot de passe a été changé. Connectez-vous avec le nouveau.',
    );
    setPhase('auth');
    return null;
  }, []);

  const handlePasswordResetCancel = useCallback(() => {
    if (supabase) void supabase.auth.signOut();
    setPhase('auth');
  }, []);

  if (phase === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ROSE} />
      </View>
    );
  }

  if (phase === 'pin') {
    return (
      <PinScreen
        title={pinTitle}
        onPinEntered={handlePinEntered}
        error={pinError}
        resetKey={pinError}
      />
    );
  }

  if (phase === 'auth') {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  if (phase === 'reset-password') {
    return (
      <PasswordResetScreen
        onSubmit={handlePasswordResetSubmit}
        onCancel={handlePasswordResetCancel}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Floraison</Text>
      </View>

      {syncError ? <Text style={styles.syncBanner}>{syncError}</Text> : null}
      <View style={styles.mainContent}>
        {loadingData ? (
          <View style={styles.centered}>
            <ActivityIndicator color={ROSE} />
          </View>
        ) : activeTab === 'suivi' ? (
          <SuiviTab
            data={cycleData}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onUpdateDay={updateDay}
          />
        ) : activeTab === 'insights' ? (
          <InsightsTab data={cycleData} onLearnMore={handleLearnMore} />
        ) : activeTab === 'corps' ? (
          <CorpsTab data={cycleData} highlightTopicId={highlightTopicId} />
        ) : (
          <SettingsTab
            data={cycleData}
            userEmail={session?.user?.email}
            pinEnabled={pinEnabled}
            onPinEnable={handlePinEnable}
            onPinDisable={handlePinDisable}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </View>

      <View style={styles.bottomTabBar}>
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.bottomTab, isActive && styles.bottomTabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <TabIcon icon={tab.Icon} active={isActive} />
              <Text style={[styles.bottomTabText, isActive && styles.bottomTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: ROSE_DEEP, letterSpacing: 0.3 },
  mainContent: { flex: 1 },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
  },
  bottomTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  bottomTabActive: { borderTopColor: ROSE },
  bottomTabText: { fontSize: 11, color: MUTED, fontWeight: '500', textAlign: 'center' },
  bottomTabTextActive: { color: ROSE_DEEP, fontWeight: '700' },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: SAGE_LIGHT,
  },
  headerBtnText: { fontSize: 13, color: TEXT, fontWeight: '600' },
  syncBanner: {
    backgroundColor: ROSE + '22',
    color: TEXT,
    textAlign: 'center',
    padding: 8,
    fontSize: 13,
  },
  tabScroll: { flex: 1 },
  tabContent: { paddingBottom: 16 },
  cycleHint: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  calendarCard: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: CARD,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: ROSE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  calendar: { borderRadius: 16 },
  calendarDayWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CALENDAR_RING_SIZE + 4,
  },
  calendarDayRing: {
    width: CALENDAR_RING_SIZE,
    height: CALENDAR_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCell: {
    width: CALENDAR_DAY_SIZE,
    height: CALENDAR_DAY_SIZE,
    borderRadius: CALENDAR_DAY_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayToday: {
    backgroundColor: SAGE_LIGHT + '55',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
  },
  calendarDayTextDisabled: {
    color: BORDER,
  },
  calendarDayDot: {
    position: 'absolute',
    width: CALENDAR_DOT_SIZE,
    height: CALENDAR_DOT_SIZE,
    borderRadius: CALENDAR_DOT_SIZE / 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, color: MUTED },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: LAVENDER, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  floralCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: ROSE,
    opacity: 0.35,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateHeaderMain: { flex: 1 },
  dateWeekday: {
    fontSize: 14,
    color: SAGE,
    fontWeight: '600',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  dateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  dateDayNum: {
    fontSize: 42,
    fontWeight: '800',
    color: ROSE_DEEP,
    lineHeight: 48,
  },
  dateMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
    textTransform: 'capitalize',
  },
  journalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    minWidth: 72,
  },
  journalBtnActive: {
    backgroundColor: LAVENDER + '33',
    borderColor: LAVENDER,
  },
  journalBtnIcon: { fontSize: 22, marginBottom: 2 },
  journalBtnLabel: { fontSize: 11, color: MUTED, fontWeight: '600' },
  journalBtnLabelActive: { color: ROSE_DEEP },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(74, 63, 71, 0.45)' },
  journalModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 28 : 24,
    borderWidth: 1,
    borderColor: BORDER,
    maxHeight: '80%',
  },
  journalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  journalModalTitle: { fontSize: 18, fontWeight: '700', color: ROSE_DEEP },
  journalModalClose: { fontSize: 22, color: MUTED, padding: 4 },
  journalModalDate: {
    fontSize: 14,
    color: SAGE,
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  journalModalInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: LAVENDER + '66',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    color: TEXT,
    backgroundColor: BG_SOFT,
    lineHeight: 24,
    marginBottom: 16,
  },
  journalModalSave: {
    backgroundColor: ROSE,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  journalModalSaveText: { color: '#FFFCF9', fontSize: 16, fontWeight: '700' },
  sectionDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: TEXT, marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  labelInline: { marginBottom: 0 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipSelected: { backgroundColor: ROSE + '28', borderColor: ROSE },
  chipText: { fontSize: 14, color: TEXT },
  chipTextSelected: { fontWeight: '600' },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  moodBtnSelected: { borderColor: ROSE, backgroundColor: ROSE + '18' },
  moodEmoji: { fontSize: 24 },
  journal: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: LAVENDER + '66',
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: TEXT,
    backgroundColor: BG_SOFT,
    lineHeight: 22,
  },
  corpsIntro: {
    fontSize: 22,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  accordion: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: SAGE_LIGHT,
  },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitle: { fontSize: 15, fontWeight: '600', color: TEXT, flex: 1, paddingRight: 8 },
  accordionChevron: { fontSize: 12, color: MUTED },
  accordionBody: { fontSize: 14, color: TEXT, lineHeight: 22, marginTop: 12 },
  pinContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pinTitle: { fontSize: 22, fontWeight: '700', color: TEXT, marginBottom: 8 },
  pinSubtitle: { fontSize: 13, color: MUTED, marginBottom: 32, textAlign: 'center' },
  pinDots: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: ROSE,
  },
  pinDotFilled: { backgroundColor: ROSE },
  pinError: { color: ROSE_DEEP, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  pinPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
  },
  pinKey: {
    width: 72,
    height: 72,
    margin: 8,
    borderRadius: 36,
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  pinKeyEmpty: { width: 72, height: 72, margin: 8 },
  pinKeyText: { fontSize: 28, color: TEXT },
  authContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  authTitle: { fontSize: 26, fontWeight: '700', color: TEXT, marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: MUTED, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: TEXT,
    backgroundColor: CARD,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: ROSE,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryBtnText: { color: '#FFFCF9', fontSize: 16, fontWeight: '700' },
  linkText: { color: ROSE_DEEP, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  authPrivacyLink: { marginTop: 20, alignSelf: 'center' },
  authPrivacyText: { color: MUTED, fontSize: 13, textDecorationLine: 'underline' },
  authInfo: {
    color: SAGE,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
