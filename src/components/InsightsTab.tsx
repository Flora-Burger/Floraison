import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { IconProps } from 'phosphor-react-native';
import {
  Bell,
  ChartLine,
  Cookie,
  Drop,
  Heart,
  MoonStars,
  Pulse,
  Smiley,
  Sparkle,
} from 'phosphor-react-native';
import type { CycleData, CyclePhaseId, InsightPhaseId } from '../types/cycle';
import {
  computeSymptomCorrelations,
  type SymptomInsight,
  type TimelineSegment,
  type TrackCategoryId,
  type UpcomingAlert,
} from '../lib/cycleInsights';
import { getCycleContextForDate } from '../lib/cyclePhase';
import { formatPhaseHero, getPhaseById } from '../constants/cycleContent';
import { parseDateKey, todayKey } from '../lib/dates';
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
  TRACK_COLORS,
} from '../constants/theme';

type InsightsTabProps = {
  data: CycleData;
};

const CATEGORY_ICONS: Record<TrackCategoryId, React.ComponentType<IconProps>> = {
  discharge: Drop,
  physical: Pulse,
  skin: Sparkle,
  mood: Smiley,
  sleep: MoonStars,
  cravings: Cookie,
  sexual: Heart,
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

function InsightCard({ insight }: { insight: SymptomInsight }) {
  const accent =
    insight.kind === 'category' && insight.categoryId
      ? TRACK_COLORS[insight.categoryId]
      : ROSE;
  const phaseTint = phaseColor(insight.phase);
  const pct = Math.round(insight.rate * 100);
  const Icon =
    insight.kind === 'category' && insight.categoryId
      ? CATEGORY_ICONS[insight.categoryId]
      : ChartLine;

  return (
    <View style={[styles.insightCard, { borderColor: accent + '44' }]}>
      <View style={[styles.insightCardTint, { backgroundColor: accent + '14' }]} />
      <View style={styles.insightCardInner}>
        <View style={styles.insightTopRow}>
          <View style={[styles.insightIconWrap, { backgroundColor: accent + '28' }]}>
            <Icon size={20} weight="duotone" color={accent} />
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

function HeroInsightCard({ insight }: { insight: SymptomInsight }) {
  const accent =
    insight.kind === 'category' && insight.categoryId
      ? TRACK_COLORS[insight.categoryId]
      : ROSE_DEEP;
  const pct = Math.round(insight.rate * 100);
  const Icon =
    insight.kind === 'category' && insight.categoryId
      ? CATEGORY_ICONS[insight.categoryId]
      : ChartLine;

  return (
    <View style={[styles.heroCard, { borderColor: accent + '55' }]}>
      <View style={[styles.heroGlow, { backgroundColor: accent + '20' }]} />
      <View style={styles.heroBadgeRow}>
        <View style={[styles.heroBadge, { backgroundColor: accent + '28' }]}>
          <Sparkle size={12} weight="fill" color={accent} />
          <Text style={[styles.heroBadgeText, { color: accent }]}>Ton pattern #1</Text>
        </View>
        {insight.confidence === 'tentative' ? (
          <View style={styles.tentativeBadge}>
            <Text style={styles.tentativeBadgeText}>À confirmer</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.heroMain}>
        <View style={[styles.heroIconWrap, { backgroundColor: accent + '30' }]}>
          <Icon size={28} weight="duotone" color={accent} />
        </View>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroLabel}>{insight.label}</Text>
          <Text style={styles.heroPhase}>{phaseChipLabel(insight.phase)}</Text>
        </View>
        <Text style={[styles.heroPct, { color: accent }]}>{pct}%</Text>
      </View>
      <RateBar rate={insight.rate} color={accent} />
      <Text style={styles.heroHint}>
        Présent sur {insight.evidenceDays} jour{insight.evidenceDays > 1 ? 's' : ''} noté
        {insight.evidenceDays > 1 ? 's' : ''} — c'est ce qui revient le plus dans ton suivi
      </Text>
    </View>
  );
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
        Points colorés = catégories où tu notes souvent
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

function CycleProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  return (
    <View style={styles.cycleProgressWrap}>
      <View style={styles.cycleProgressTrack}>
        <View style={[styles.cycleProgressFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.cycleProgressLabel}>
        {current}/{total} cycle{total > 1 ? 's' : ''}
      </Text>
    </View>
  );
}

export function InsightsTab({ data }: InsightsTabProps) {
  const result = useMemo(() => computeSymptomCorrelations(data), [data]);
  const ctx = useMemo(() => getCycleContextForDate(data, todayKey()), [data]);

  const phase = ctx ? getPhaseById(ctx.phase) : null;
  const phaseSummary = phase ? formatPhaseHero(phase) : null;

  const hasInsights =
    result.categoryInsights.length > 0 || result.symptomInsights.length > 0;
  const totalPatterns =
    result.categoryInsights.length + result.symptomInsights.length;
  const heroId = result.heroInsight?.id;
  const categoryList = heroId
    ? result.categoryInsights.filter((i) => i.id !== heroId)
    : result.categoryInsights;
  const symptomList = heroId
    ? result.symptomInsights.filter((i) => i.id !== heroId)
    : result.symptomInsights;

  return (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Sparkle size={22} weight="fill" color={ROSE_DEEP} />
        </View>
        <View>
          <Text style={styles.intro}>Tes insights</Text>
          <Text style={styles.introSub}>
            {hasInsights
              ? `${totalPatterns} tendance${totalPatterns > 1 ? 's' : ''} repérée${totalPatterns > 1 ? 's' : ''} dans ton cycle`
              : 'Tes patterns apparaissent au fil du suivi'}
          </Text>
        </View>
      </View>

      {phaseSummary && phase ? (
        <View style={[styles.phaseCard, { borderColor: phase.color + '88' }]}>
          <View style={[styles.phaseCardGlow, { backgroundColor: phase.color + '18' }]} />
          <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
          <Text style={styles.phaseCardTitle}>Aujourd'hui</Text>
          <Text style={styles.phaseCardHeadline}>{phaseSummary.headline}</Text>
          <Text style={styles.phaseCardSymptoms}>{phaseSummary.symptomsLine}</Text>
        </View>
      ) : null}

      {!result.ready ? (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            {hasInsights ? 'Premiers signaux détectés' : 'En attente de données'}
          </Text>
          <Text style={styles.progressBody}>
            {hasInsights
              ? 'Ces tendances viennent de ton premier cycle. Un second cycle les rendra plus fiables.'
              : 'Note tes symptômes quelques jours par phase — tes insights personnalisés suivront.'}
          </Text>
          <CycleProgressBar
            current={result.cycleCount}
            total={result.minCyclesRequired}
          />
        </View>
      ) : (
        <View style={styles.confidenceCard}>
          <Text style={styles.confidenceTitle}>Profil cycle établi</Text>
          <Text style={styles.confidenceBody}>
            Tes insights sont basés sur {result.cycleCount} cycle
            {result.cycleCount > 1 ? 's' : ''} enregistré{result.cycleCount > 1 ? 's' : ''}.
          </Text>
        </View>
      )}

      {!hasInsights ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyTitle}>
            {result.cycleCount === 0
              ? 'Ton tableau de bord t\'attend'
              : 'Encore un peu de patience'}
          </Text>
          <Text style={styles.emptyBody}>
            {result.cycleCount === 0
              ? 'Commence par noter tes règles, puis ajoute symptômes, humeur et sommeil au quotidien.'
              : 'Les corrélations apparaissent quand une tendance dépasse 50 % des jours notés sur une phase.'}
          </Text>
        </View>
      ) : (
        <>
          {result.heroInsight ? (
            <View style={styles.heroSection}>
              <HeroInsightCard insight={result.heroInsight} />
            </View>
          ) : null}

          {result.timeline.length > 0 ? (
            <CycleTimeline
              segments={result.timeline}
              position={result.timelinePosition}
              cycleDay={ctx?.cycleDay}
              cycleLength={ctx?.cycleLength}
            />
          ) : null}

          <UpcomingSection alerts={result.upcoming} />

          {categoryList.length > 0 ? (
            <View style={styles.insightsSection}>
              <Text style={styles.sectionLabel}>Par catégorie</Text>
              <Text style={styles.sectionHint}>
                Où tu notes le plus souvent chaque type de suivi
              </Text>
              {categoryList.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          ) : null}

          {symptomList.length > 0 ? (
            <View style={styles.insightsSection}>
              <Text style={styles.sectionLabel}>Symptômes marquants</Text>
              <Text style={styles.sectionHint}>
                Ce qui revient le plus dans ton cycle
              </Text>
              {symptomList.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabScroll: { flex: 1, backgroundColor: BG },
  tabContent: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    fontSize: 22,
    fontWeight: '800',
    color: ROSE_DEEP,
    letterSpacing: -0.3,
  },
  introSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
    lineHeight: 18,
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
});
