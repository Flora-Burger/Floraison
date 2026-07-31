import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CalendarBlank,
  ChartLine,
  Heart,
  Leaf,
  MoonStars,
  type IconProps,
} from 'phosphor-react-native';
import {
  computePersonalDiscoveries,
  MIN_CYCLES_FOR_DISCOVERIES,
  type DiscoveryIcon,
  type PersonalDiscovery,
} from '../lib/personalDiscoveries';
import type { CycleData } from '../types/cycle';
import { BG_SOFT, BORDER, MUTED, ROSE, TEXT } from '../constants/theme';
import { useMemo, type ComponentType } from 'react';

const ICON_MAP: Record<DiscoveryIcon, ComponentType<IconProps>> = {
  symptom: ChartLine,
  cycle: Leaf,
  mood: Heart,
  calendar: CalendarBlank,
  sleep: MoonStars,
};

function DiscoveryCard({
  discovery,
  onLearnMore,
}: {
  discovery: PersonalDiscovery;
  onLearnMore?: (articleId: string) => void;
}) {
  const Icon = ICON_MAP[discovery.icon];
  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${discovery.title}. ${discovery.body}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: ROSE + '22' }]}>
        <Icon size={20} weight="duotone" color={ROSE} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{discovery.title}</Text>
        <Text style={styles.text}>{discovery.body}</Text>
        {discovery.articleId && onLearnMore ? (
          <TouchableOpacity
            style={styles.learnMoreBtn}
            onPress={() => onLearnMore(discovery.articleId!)}
            accessibilityRole="button"
            accessibilityLabel="En savoir plus dans Corps"
          >
            <Text style={styles.learnMoreText}>En savoir plus →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

type PersonalDiscoveriesSectionProps = {
  data: CycleData;
  onLearnMore?: (articleId: string) => void;
};

export function PersonalDiscoveriesSection({
  data,
  onLearnMore,
}: PersonalDiscoveriesSectionProps) {
  const result = useMemo(() => computePersonalDiscoveries(data), [data]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Ce qui revient chez toi</Text>
      <Text style={styles.sectionHint}>
        Phrases tirées de ton historique — factuelles, jamais médicales
      </Text>

      {!result.ready ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>On observe encore</Text>
          <Text style={styles.emptyBody}>
            Reviens dans quelques cycles : on commence à voir des motifs se dessiner dans tes
            données ({result.cycleCount}/{MIN_CYCLES_FOR_DISCOVERIES} cycles enregistrés).
          </Text>
        </View>
      ) : result.discoveries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Pas encore de motif net</Text>
          <Text style={styles.emptyBody}>
            Continue à noter humeur et symptômes quelques jours par phase — les motifs
            personnels apparaîtront ici.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.leadCard}>
            <Text style={styles.leadLabel}>En ce moment</Text>
            <Text style={styles.leadText}>{result.discoveries[0]!.body}</Text>
          </View>
          {result.discoveries.map((d) => (
            <DiscoveryCard key={d.id} discovery={d} onLearnMore={onLearnMore} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 12,
  },
  leadCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: ROSE + '14',
    borderWidth: 1,
    borderColor: ROSE + '44',
    marginBottom: 12,
  },
  leadLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ROSE,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  leadText: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
  learnMoreBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: ROSE,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
  },
});
