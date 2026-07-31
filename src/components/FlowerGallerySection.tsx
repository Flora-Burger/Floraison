import { useEffect, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShareNetwork, Sparkle } from 'phosphor-react-native';
import { PlantCompanion } from './PlantCompanion';
import {
  loadPlantGallery,
  type FlowerVariante,
  type FlowerVariantRecord,
  type PlantGalleryState,
} from '../lib/plantRarity';
import { BG_SOFT, BORDER, MUTED, ROSE, TEXT } from '../constants/theme';

const VARIANT_LABELS: Record<FlowerVariante, string> = {
  commune: 'Commune',
  rare: 'Rare',
  tres_rare: 'Très rare',
};

const ALL_VARIANTS: FlowerVariante[] = ['commune', 'rare', 'tres_rare'];

type FlowerGallerySectionProps = {
  userId?: string;
};

function formatSeenAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function FlowerGallerySection({ userId }: FlowerGallerySectionProps) {
  const [gallery, setGallery] = useState<PlantGalleryState | null>(null);

  useEffect(() => {
    if (!userId) {
      setGallery(null);
      return;
    }
    let cancelled = false;
    void loadPlantGallery(userId).then((g) => {
      if (!cancelled) setGallery(g);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const records: FlowerVariantRecord[] = gallery
    ? Object.values(gallery.byCycle).sort((a, b) => b.seenAt.localeCompare(a.seenAt))
    : [];
  const seen = new Set(gallery?.seenVariants ?? []);

  const shareVariant = async (variante: FlowerVariante) => {
    const label = VARIANT_LABELS[variante];
    try {
      await Share.share({
        message: `Ma fleur Floraison — variante ${label.toLowerCase()}. Collection personnelle, sans données de santé.`,
        title: `Fleur ${label}`,
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Sparkle size={18} weight="duotone" color={ROSE} />
        <Text style={styles.sectionLabel}>Galerie florale</Text>
      </View>
      <Text style={styles.sectionHint}>
        Variantes découvertes à l’ovulation — collection au fil des cycles
      </Text>

      {!userId ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyBody}>Connecte-toi pour garder ta collection.</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Encore vide</Text>
          <Text style={styles.emptyBody}>
            À mi-ovulation, ta fleur peut apparaître rare ou très rare. Reviens quand tu auras
            traversé cette phase.
          </Text>
          <View style={styles.previewRow}>
            {ALL_VARIANTS.map((v) => (
              <View key={v} style={[styles.thumb, !seen.has(v) && styles.thumbLocked]}>
                <PlantCompanion
                  phase="ovulatoire"
                  progression={0.55}
                  size={72}
                  variante={v}
                />
                <Text style={styles.thumbLabel}>
                  {seen.has(v) ? VARIANT_LABELS[v] : '???'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.previewRow}>
            {ALL_VARIANTS.map((v) => (
              <View key={v} style={[styles.thumb, !seen.has(v) && styles.thumbLocked]}>
                {seen.has(v) ? (
                  <PlantCompanion
                    phase="ovulatoire"
                    progression={0.55}
                    size={72}
                    variante={v}
                  />
                ) : (
                  <View style={styles.lockedPlaceholder}>
                    <Text style={styles.lockedMark}>?</Text>
                  </View>
                )}
                <Text style={styles.thumbLabel}>
                  {seen.has(v) ? VARIANT_LABELS[v] : 'À découvrir'}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.historyTitle}>Tes floraisons</Text>
          {records.slice(0, 6).map((r) => (
            <View key={r.cycleStart} style={styles.historyRow}>
              <PlantCompanion
                phase="ovulatoire"
                progression={0.5}
                size={48}
                variante={r.variante}
              />
              <View style={styles.historyCopy}>
                <Text style={styles.historyLabel}>{VARIANT_LABELS[r.variante]}</Text>
                <Text style={styles.historyMeta}>
                  Cycle du {r.cycleStart}
                  {r.seenAt ? ` · ${formatSeenAt(r.seenAt)}` : ''}
                </Text>
              </View>
              {r.variante !== 'commune' ? (
                <TouchableOpacity
                  onPress={() => void shareVariant(r.variante)}
                  accessibilityLabel={`Partager variante ${VARIANT_LABELS[r.variante]}`}
                  hitSlop={8}
                >
                  <ShareNetwork size={20} color={ROSE} weight="bold" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
  },
  sectionHint: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 14,
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
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  thumb: {
    flex: 1,
    alignItems: 'center',
  },
  thumbLocked: {
    opacity: 0.55,
  },
  thumbLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  lockedPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: BORDER + '88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedMark: {
    fontSize: 22,
    fontWeight: '700',
    color: MUTED,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    marginTop: 16,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  historyCopy: { flex: 1 },
  historyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
  },
  historyMeta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
});
