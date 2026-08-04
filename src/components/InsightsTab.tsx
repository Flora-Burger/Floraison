import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, ChartLine } from 'phosphor-react-native';
import type { CycleData, CyclePhaseId, InsightPhaseId } from '../types/cycle';
import {
  computeSymptomCorrelations,
  type SymptomInsight,
  type TimelineSegment,
  type UpcomingAlert,
} from '../lib/cycleInsights';
import { getArticleIdForInsight } from '../lib/insightArticles';
import { getCycleContextForDate } from '../lib/cyclePhase';
import {
  computeAvgCycleLength,
  computeAvgPeriodDays,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_DAYS,
  getCycleRegularity,
  getPeriodStarts,
} from '../lib/cycleMath';
import { formatNextPeriodRangeLabel, getNextPeriodWindow } from '../lib/cyclePredictions';
import { CycleCompareSection } from './CycleCompareSection';
import { getPhaseById } from '../constants/cycleContent';
import { parseDateKey, todayKey } from '../lib/dates';
import {
  DEFAULT_PREDICTION_PREFS,
  shouldPausePredictions,
  type PredictionPrefs,
} from '../lib/predictionPrefs';
import { usePhaseAccent } from '../context/PhaseAccentContext';
import {
  BG,
  BG_SOFT,
  BORDER,
  CARD,
  LAVENDER,
  MUTED,
  ROSE,
  ROSE_DEEP,
  SAGE,
  SAGE_LIGHT,
  TEXT,
} from '../constants/theme';

type InsightsTabProps = {
  data: CycleData;
  onLearnMore?: (articleId: string) => void;
  predPrefs?: PredictionPrefs;
};

function phaseColor(phase: InsightPhaseId): string {
  if (phase === 'avant_regles') return ROSE;
  return getPhaseById(phase).color;
}

function phaseChipLabel(phase: InsightPhaseId): string {
  if (phase === 'avant_regles') return 'Semaine avant règles';
  return getPhaseById(phase).shortTitle;
}

function RateBar({ rate, color }: { rate: number; color: string }) {
  const pct = Math.round(rate * 100);
  return (
    <View style={styles.rateBarTrack}>
      <View
        style={[
          styles.rateBarFill,
          { width: `${pct}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function LearnMoreButton({
  insight,
  onLearnMore,
}: {
  insight: SymptomInsight;
  onLearnMore?: (articleId: string) => void;
}) {
  const articleId = getArticleIdForInsight(insight);
  if (!articleId || !onLearnMore) return null;
  return (
    <TouchableOpacity style={styles.learnMoreBtn} onPress={() => onLearnMore(articleId)}>
      <Text style={styles.learnMoreText}>En savoir plus →</Text>
    </TouchableOpacity>
  );
}

function InsightCard({
  insight,
  onLearnMore,
}: {
  insight: SymptomInsight;
  onLearnMore?: (articleId: string) => void;
}) {
  const accent = ROSE;
  const phaseTint = phaseColor(insight.phase);
  const pct = Math.round(insight.rate * 100);

  return (
    <View style={[styles.insightCard, { borderColor: accent + '44' }]}>
      <View style={[styles.insightCardTint, { backgroundColor: accent + '14' }]} />
      <View style={styles.insightCardInner}>
        <View style={styles.insightTopRow}>
          <View style={[styles.insightIconWrap, { backgroundColor: accent + '28' }]}>
            <ChartLine size={20} weight="duotone" color={accent} />
          </View>
          <View style={styles.insightTitleBlock}>
            <Text style={styles.insightTitle} numberOfLines={2}>
              {insight.label}
            </Text>
            <View style={[styles.phaseChip, { backgroundColor: phaseTint + '22', borderColor: phaseTint + '66' }]}>
              <Text style={[styles.phaseChipText, { color: phaseTint }]}>
                {phaseChipLabel(insight.phase)}
              </Text>
            </View>
          </View>
          <View style={styles.rateBlock}>
            <Text style={[styles.rateNumber, { color: accent }]}>{pct}%</Text>
          </View>
        </View>

        <RateBar rate={insight.rate} color={accent} />

        <View style={styles.insightFooter}>
          <Text style={styles.insightHint}>
            {insight.evidenceDays === 1
              ? '1 jour noté dans cette fenêtre'
              : `${insight.evidenceDays} jours notés dans cette fenêtre`}
          </Text>
          {insight.confidence === 'tentative' ? (
            <View style={styles.tentativeBadge}>
              <Text style={styles.tentativeBadgeText}>À confirmer</Text>
            </View>
          ) : (
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedBadgeText}>Confirmé</Text>
            </View>
          )}
        </View>
        <LearnMoreButton insight={insight} onLearnMore={onLearnMore} />
      </View>
    </View>
  );
}

function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const PHASE_SHORT: Record<CyclePhaseId, string> = {
  menstruelle: 'Règles',
  folliculaire: 'Foll.',
  ovulatoire: 'Ovul.',
  luteale: 'Lutéale',
};

function CycleTimeline({
  segments,
  position,
  cycleDay,
  cycleLength,
}: {
  segments: TimelineSegment[];
  position: number;
  cycleDay?: number;
  cycleLength?: number;
}) {
  if (segments.length === 0) return null;

  return (
    <View style={styles.timelineCard}>
      <Text style={styles.timelineTitle}>Ton cycle en un coup d'œil</Text>
      <Text style={styles.timelineHint}>
        Points colorés = symptômes qui reviennent souvent
      </Text>
      <View style={styles.timelineBar}>
        {segments.map((seg) => (
          <View
            key={seg.phaseId}
            style={[
              styles.timelineSegment,
              {
                flex: seg.flex,
                backgroundColor: seg.color + (seg.patternColors.length > 0 ? 'CC' : '44'),
              },
            ]}
          >
            {seg.patternColors.length > 0 ? (
              <View style={styles.timelineDots}>
                {seg.patternColors.map((c) => (
                  <View key={c} style={[styles.timelineDot, { backgroundColor: c }]} />
                ))}
              </View>
            ) : null}
          </View>
        ))}
        <View style={[styles.timelineMarker, { left: `${position * 100}%` }]}>
          <View style={styles.timelineMarkerDot} />
          <Text style={styles.timelineMarkerLabel}>Auj.</Text>
        </View>
      </View>
      <View style={styles.timelineLabels}>
        {segments.map((seg) => (
          <Text
            key={seg.phaseId}
            style={[styles.timelinePhaseLabel, { flex: seg.flex }]}
            numberOfLines={1}
          >
            {PHASE_SHORT[seg.phaseId]}
          </Text>
        ))}
      </View>
      <Text style={styles.timelineDayHint}>
        {cycleDay && cycleLength
          ? `Jour ${cycleDay} sur ~${cycleLength}`
          : 'Position dans ton cycle actuel'}
      </Text>
    </View>
  );
}

function UpcomingSection({ alerts }: { alerts: UpcomingAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <View style={styles.upcomingSection}>
      <View style={styles.upcomingHeader}>
        <Bell size={18} weight="duotone" color={ROSE_DEEP} />
        <Text style={styles.upcomingTitle}>À venir</Text>
      </View>
      <Text style={styles.upcomingHint}>
        D'après tes cycles passés, voici ce qui pourrait revenir bientôt
      </Text>
      {alerts.map((alert) => {
        const tint = phaseColor(alert.phase);
        const pct = Math.round(alert.rate * 100);
        return (
          <View key={alert.id} style={[styles.upcomingCard, { borderColor: tint + '44' }]}>
            <View style={[styles.upcomingAccent, { backgroundColor: tint }]} />
            <View style={styles.upcomingBody}>
              <Text style={styles.upcomingLabel}>{alert.label}</Text>
              <Text style={styles.upcomingWhen}>
                {alert.daysUntil === 1
                  ? `Demain · ${formatShortDate(alert.targetDate)}`
                  : `Dans ${alert.daysUntil} jours · ${formatShortDate(alert.targetDate)}`}
              </Text>
              <Text style={styles.upcomingMeta}>
                {phaseChipLabel(alert.phase)} · noté {pct}% du temps
                {alert.confidence === 'tentative' ? ' · à confirmer' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function InsightsTab({
  data,
  onLearnMore,
  predPrefs = DEFAULT_PREDICTION_PREFS,
}: InsightsTabProps) {
  const pausePredictions = shouldPausePredictions(data, predPrefs);

  const result = useMemo(() => computeSymptomCorrelations(data), [data]);
  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  const hasInsights = result.symptomInsights.length > 0;
  const totalPatterns = result.symptomInsights.length;

  const cycleLength = useMemo(() => computeAvgCycleLength(data), [data]);
  const periodDays = useMemo(() => computeAvgPeriodDays(data), [data]);
  const periodStartCount = useMemo(() => getPeriodStarts(data).length, [data]);
  const hasPredictionHistory = periodStartCount >= 2;
  const nextPeriodLabel = useMemo(() => formatNextPeriodRangeLabel(data, todayKey()), [data]);
  const nextPeriodWindow = useMemo(() => getNextPeriodWindow(data, todayKey()), [data]);
  const regularity = useMemo(() => getCycleRegularity(data), [data]);
  const { chrome } = usePhaseAccent();

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: chrome }]}>Insights</Text>
        <Text style={styles.intro}>Tendances & prédictions</Text>
        <Text style={styles.introSub}>
          {hasInsights
            ? `${totalPatterns} tendance${totalPatterns > 1 ? 's' : ''} sur tes cycles`
            : 'Les motifs apparaissent après quelques cycles notés'}
        </Text>
      </View>

      <View style={styles.predictionsCard}>
        <Text style={styles.predictionsTitle}>Prochaines règles</Text>
        {pausePredictions ? (
          <>
            <Text style={styles.predictionsNext}>Prédictions en pause</Text>
            <Text style={styles.predictionsBody}>
              Réactive-les dans Paramètres, ou note simplement tes règles quand elles arrivent.
            </Text>
          </>
        ) : (
          <>
            {nextPeriodLabel ? (
              <Text style={styles.predictionsNext}>{nextPeriodLabel}</Text>
            ) : (
              <Text style={styles.predictionsNext}>Pas encore estimable</Text>
            )}
            <Text style={styles.predictionsBody}>
              {hasPredictionHistory
                ? `Moyennes : cycle ~${cycleLength} j · règles ~${periodDays} j`
                : `Par défaut : cycle ${DEFAULT_CYCLE_LENGTH} j · règles ${DEFAULT_PERIOD_DAYS} j — se précise après 2 cycles`}
            </Text>
            {nextPeriodWindow?.fromHistory ? (
              <Text style={styles.predictionsRangeHint}>
                Fourchette historique {regularity.minGap}–{regularity.maxGap} j
              </Text>
            ) : null}
            {regularity.status === 'irregular' || regularity.status === 'slightly_variable' ? (
              <Text style={styles.regularityNoteText}>{regularity.label}</Text>
            ) : null}
          </>
        )}
      </View>

      <CycleCompareSection data={data} />

      {!hasInsights ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {result.cycleCount === 0 ? 'Pas encore de données' : 'Encore un peu tôt'}
          </Text>
          <Text style={styles.emptyBody}>
            {result.cycleCount === 0
              ? 'Note règles, symptômes et humeur dans Suivi — les tendances arriveront ici.'
              : 'Un symptôme doit revenir souvent dans une phase (≥ 65 %, sur ≥ 2 cycles) pour apparaître.'}
          </Text>
        </View>
      ) : (
        <>
          {result.timeline.length > 0 ? (
            <CycleTimeline
              segments={result.timeline}
              position={result.timelinePosition}
              cycleDay={ctx?.cycleDay}
              cycleLength={ctx?.cycleLength}
            />
          ) : null}

          <UpcomingSection alerts={result.upcoming} />

          <View style={styles.insightsSection}>
            <Text style={styles.sectionLabel}>Symptômes marquants</Text>
            <Text style={styles.sectionHint}>
              Ce qui revient surtout pendant une phase précise
            </Text>
            {result.symptomInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} onLearnMore={onLearnMore} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1, backgroundColor: BG },
  tabContent: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 6,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ROSE + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ROSE + '33',
  },
  intro: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  introSub: {
    fontSize: 14,
    color: MUTED,
    marginTop: 8,
    lineHeight: 20,
  },
  phaseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  phaseCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  phaseEmoji: { fontSize: 28, marginBottom: 6 },
  phaseCardTitle: { fontSize: 11, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  phaseCardHeadline: { fontSize: 17, color: TEXT, fontWeight: '700', lineHeight: 24, marginTop: 2 },
  phaseCardSymptoms: { fontSize: 13, color: MUTED, lineHeight: 19, marginTop: 6 },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: BG_SOFT,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: ROSE + '33',
  },
  progressTitle: { fontSize: 15, fontWeight: '700', color: ROSE_DEEP, marginBottom: 6 },
  progressBody: { fontSize: 13, color: MUTED, lineHeight: 20, marginBottom: 12 },
  confidenceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: SAGE_LIGHT + '44',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: SAGE + '55',
  },
  confidenceTitle: { fontSize: 14, fontWeight: '700', color: SAGE, marginBottom: 4 },
  confidenceBody: { fontSize: 13, color: MUTED, lineHeight: 19 },
  predictionsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  predictionsTitle: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 6 },
  predictionsNext: { fontSize: 15, fontWeight: '600', color: ROSE_DEEP, marginBottom: 6, lineHeight: 21 },
  predictionsRangeHint: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 8,
    lineHeight: 17,
  },
  predictionsBody: { fontSize: 13, color: MUTED, lineHeight: 19 },
  regularityWarning: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: ROSE + '14',
    borderWidth: 1,
    borderColor: ROSE + '44',
  },
  regularityWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginBottom: 4,
  },
  regularityWarningBody: { fontSize: 12, color: TEXT, lineHeight: 18 },
  regularityNote: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  regularityNoteText: { fontSize: 12, color: MUTED, lineHeight: 18 },
  regularityOk: {
    marginTop: 8,
    fontSize: 12,
    color: SAGE,
    fontWeight: '600',
    lineHeight: 18,
  },
  cycleProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cycleProgressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ROSE,
  },
  cycleProgressLabel: { fontSize: 12, fontWeight: '700', color: ROSE_DEEP, minWidth: 52 },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: TEXT, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: MUTED, lineHeight: 21, textAlign: 'center' },
  insightsSection: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 4,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  insightCardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  insightCardInner: { padding: 14 },
  insightTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitleBlock: { flex: 1, gap: 6 },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 20,
  },
  phaseChip: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  phaseChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateBlock: { alignItems: 'flex-end', minWidth: 44 },
  rateNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  rateBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: BG_SOFT,
    overflow: 'hidden',
    marginBottom: 10,
  },
  rateBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  insightHint: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  tentativeBadge: {
    backgroundColor: LAVENDER + '33',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: LAVENDER + '66',
  },
  tentativeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ROSE_DEEP,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  confirmedBadge: {
    backgroundColor: SAGE + '22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: SAGE + '55',
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: SAGE,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  heroSection: { paddingHorizontal: 16, marginBottom: 12 },
  heroCard: {
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: { flex: 1 },
  heroLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  heroPhase: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
    fontWeight: '600',
  },
  heroPct: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroHint: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 17,
    marginTop: 8,
  },
  timelineCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 4,
  },
  timelineHint: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 14,
    lineHeight: 17,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'visible',
    position: 'relative',
  },
  timelineSegment: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 8,
  },
  timelineDots: {
    flexDirection: 'row',
    gap: 3,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFCF988',
  },
  timelineMarker: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    marginLeft: -8,
    zIndex: 2,
  },
  timelineMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TEXT,
    borderWidth: 2,
    borderColor: CARD,
  },
  timelineMarkerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT,
    marginTop: 1,
  },
  timelineLabels: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 2,
  },
  timelinePhaseLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineDayHint: {
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
    textAlign: 'center',
  },
  upcomingSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
  },
  upcomingHint: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 4,
  },
  upcomingCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  upcomingAccent: {
    width: 4,
  },
  upcomingBody: {
    flex: 1,
    padding: 14,
  },
  upcomingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  upcomingWhen: {
    fontSize: 13,
    color: ROSE_DEEP,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingMeta: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  learnMoreBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: ROSE_DEEP,
  },
});
