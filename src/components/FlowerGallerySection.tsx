import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ImageIcon, ShareNetwork, Sparkle } from 'phosphor-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PlantCompanion } from './PlantCompanion';
import {
  galleryAlbumSeason,
  galleryBloomCount,
  loadPlantGallery,
  resolveDisplaySpecies,
  resolveRecordSpecies,
  type FlowerVariantRecord,
  type PlantGalleryState,
} from '../lib/plantRarity';
import {
  collectionProgress,
  FLOWER_SPECIES,
  RARITY_LABELS,
  type FlowerSpeciesId,
} from '../constants/flowerSpecies';
import { nextAlbumSeason } from '../constants/albumSeason';
import { alertAsync } from '../lib/confirmDialog';
import { BG_SOFT, BORDER, MUTED, ROSE, ROSE_DEEP, TEXT } from '../constants/theme';
import { parseDateKey } from '../lib/dates';

type FlowerGallerySectionProps = {
  userId?: string;
};

function formatCycle(cycleStart: string): string {
  try {
    return parseDateKey(cycleStart).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return cycleStart;
  }
}

export function FlowerGallerySection({ userId }: FlowerGallerySectionProps) {
  const [gallery, setGallery] = useState<PlantGalleryState | null>(null);
  const [postcardId, setPostcardId] = useState<FlowerSpeciesId | null>(null);
  const [busy, setBusy] = useState(false);
  const shotRef = useRef<View>(null);

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

  const seen = new Set<FlowerSpeciesId>(gallery?.seenSpecies ?? []);
  const progress = collectionProgress(Array.from(seen));
  const records: FlowerVariantRecord[] = gallery
    ? Object.values(gallery.byCycle).sort((a, b) => b.seenAt.localeCompare(a.seenAt))
    : [];
  const bloomCount = gallery ? galleryBloomCount(gallery) : 0;
  const seasonResolved = gallery ? galleryAlbumSeason(gallery) : null;
  const nextSeason = seasonResolved ? nextAlbumSeason(bloomCount) : null;
  const signature = gallery ? resolveDisplaySpecies(gallery, null) : null;

  const shareSpeciesText = async (speciesId: FlowerSpeciesId) => {
    const species = FLOWER_SPECIES.find((s) => s.id === speciesId);
    if (!species) return;
    try {
      await Share.share({
        message: `Floraison — j’ai débloqué « ${species.name} » (${RARITY_LABELS[species.rarity].toLowerCase()}) dans ma collection. Pas de données de santé, juste une fleur.`,
        title: species.name,
      });
    } catch {
      /* ignore */
    }
  };

  const sharePostcard = async (speciesId: FlowerSpeciesId) => {
    if (busy) return;
    setPostcardId(speciesId);
    setBusy(true);
    // Laisse React monter la carte hors écran
    await new Promise((r) => setTimeout(r, 80));
    try {
      if (Platform.OS === 'web') {
        await shareSpeciesText(speciesId);
        await alertAsync(
          'Carte postale',
          'Sur le web, le partage texte est utilisé — l’image marche sur mobile.',
        );
        return;
      }
      if (!shotRef.current) return;
      const uri = await captureRef(shotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        await alertAsync('Image prête', fileUri);
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Carte postale Floraison',
        UTI: 'public.png',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      await alertAsync('Partage impossible', msg);
    } finally {
      setBusy(false);
      setPostcardId(null);
    }
  };

  const postcardSpecies = postcardId
    ? FLOWER_SPECIES.find((s) => s.id === postcardId)
    : null;

  return (
    <View
      style={styles.section}
      accessibilityRole="summary"
      accessibilityLabel={`Collection florale, ${progress.label}`}
    >
      <View style={styles.headerRow}>
        <Sparkle size={18} weight="duotone" color={ROSE} />
        <Text style={styles.sectionLabel}>Collection florale</Text>
      </View>
      <Text style={styles.sectionHint}>
        À chaque ovulation, une fleur est tirée pour ce cycle. Remplis l’album au fil des mois —
        8 espèces, dont 2 très rares.
      </Text>

      {!userId ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyBody}>Connecte-toi pour garder ta collection.</Text>
        </View>
      ) : (
        <>
          {seasonResolved ? (
            <View style={[styles.seasonCard, { backgroundColor: seasonResolved.frameTint }]}>
              <Text style={styles.seasonTitle}>
                Saison {seasonResolved.name}
              </Text>
              <Text style={styles.seasonBlurb}>{seasonResolved.blurb}</Text>
              {signature?.isSignature || (signature && bloomCount > 0) ? (
                <Text style={styles.seasonMeta}>
                  Fleur signature : {signature.name}
                </Text>
              ) : null}
              {nextSeason ? (
                <Text style={styles.seasonNext}>
                  Prochaine saison « {nextSeason.name} » après {nextSeason.minBlooms}{' '}
                  floraisons ({bloomCount}/{nextSeason.minBlooms})
                </Text>
              ) : (
                <Text style={styles.seasonNext}>Toutes les saisons débloquées.</Text>
              )}
            </View>
          ) : null}

          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>{progress.label} découvertes</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round((progress.found / progress.total) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              Le tirage a lieu en phase ovulatoire (milieu de phase). Une fleur par cycle.
            </Text>
          </View>

          <Text style={styles.albumTitle}>Album</Text>
          <View style={styles.albumGrid}>
            {FLOWER_SPECIES.map((species) => {
              const unlocked = seen.has(species.id);
              return (
                <View
                  key={species.id}
                  style={[styles.slot, !unlocked && styles.slotLocked]}
                  accessibilityLabel={
                    unlocked
                      ? `${species.name}, ${RARITY_LABELS[species.rarity]}`
                      : `Fleur non découverte, ${RARITY_LABELS[species.rarity]}`
                  }
                >
                  {unlocked ? (
                    <PlantCompanion
                      phase="ovulatoire"
                      progression={0.55}
                      size={78}
                      variante={species.rarity}
                      speciesId={species.id}
                      seasonId={seasonResolved?.id}
                    />
                  ) : (
                    <View style={styles.lockedPlaceholder}>
                      <Text style={styles.lockedMark}>?</Text>
                    </View>
                  )}
                  <Text style={styles.slotName}>
                    {unlocked ? species.name : '???'}
                  </Text>
                  <Text style={styles.slotRarity}>{RARITY_LABELS[species.rarity]}</Text>
                  {unlocked ? (
                    <Text style={styles.slotBlurb} numberOfLines={2}>
                      {species.blurb}
                    </Text>
                  ) : (
                    <Text style={styles.slotBlurbLocked}>À découvrir à l’ovulation</Text>
                  )}
                  {unlocked ? (
                    <View style={styles.shareRow}>
                      <TouchableOpacity
                        onPress={() => void shareSpeciesText(species.id)}
                        hitSlop={8}
                        accessibilityLabel={`Partager ${species.name} en texte`}
                        style={styles.shareBtn}
                      >
                        <ShareNetwork size={16} color={ROSE} weight="bold" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void sharePostcard(species.id)}
                        hitSlop={8}
                        disabled={busy}
                        accessibilityLabel={`Carte postale ${species.name}`}
                        style={styles.shareBtn}
                      >
                        <ImageIcon size={16} color={ROSE} weight="bold" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {records.length > 0 ? (
            <>
              <Text style={styles.historyTitle}>Floraisons par cycle</Text>
              {records.slice(0, 8).map((r) => {
                const species = resolveRecordSpecies(r);
                return (
                  <View key={r.cycleStart} style={styles.historyRow}>
                    <PlantCompanion
                      phase="ovulatoire"
                      progression={0.5}
                      size={48}
                      variante={r.variante}
                      speciesId={species.id}
                      seasonId={seasonResolved?.id}
                    />
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyLabel}>{species.name}</Text>
                      <Text style={styles.historyMeta}>
                        {RARITY_LABELS[r.variante]} · cycle du {formatCycle(r.cycleStart)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Pas encore de floraison</Text>
              <Text style={styles.emptyBody}>
                Quand tu traverses l’ovulation, une espèce est tirée une fois pour ce cycle.
                Reviens ici pour voir l’album se remplir.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Carte postale hors écran pour capture */}
      {postcardSpecies ? (
        <View
          ref={shotRef}
          collapsable={false}
          style={styles.postcard}
          pointerEvents="none"
        >
          <Text style={styles.postcardBrand}>Floraison</Text>
          <PlantCompanion
            phase="ovulatoire"
            progression={0.6}
            size={140}
            variante={postcardSpecies.rarity}
            speciesId={postcardSpecies.id}
            seasonId={seasonResolved?.id}
          />
          <Text style={styles.postcardName}>{postcardSpecies.name}</Text>
          <Text style={styles.postcardMeta}>
            {RARITY_LABELS[postcardSpecies.rarity]} · collection personnelle
          </Text>
          <Text style={styles.postcardFoot}>Sans données de santé — juste une fleur.</Text>
        </View>
      ) : null}
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
  seasonCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: ROSE_DEEP,
  },
  seasonBlurb: {
    fontSize: 13,
    color: TEXT,
    marginTop: 4,
    lineHeight: 18,
  },
  seasonMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT,
    marginTop: 6,
  },
  seasonNext: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
  },
  progressCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ROSE,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: MUTED,
    marginTop: 8,
    lineHeight: 15,
  },
  albumTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  slot: {
    width: '47%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  slotLocked: {
    opacity: 0.72,
  },
  slotName: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },
  slotRarity: {
    fontSize: 11,
    fontWeight: '600',
    color: ROSE_DEEP,
    marginTop: 2,
  },
  slotBlurb: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  slotBlurbLocked: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
    fontStyle: 'italic',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  shareBtn: {
    padding: 4,
  },
  lockedPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: BORDER + '99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedMark: {
    fontSize: 22,
    fontWeight: '700',
    color: MUTED,
  },
  emptyCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
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
  postcard: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 280,
    padding: 20,
    backgroundColor: '#FFFCF9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  postcardBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: ROSE_DEEP,
    marginBottom: 12,
  },
  postcardName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
  },
  postcardMeta: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
  },
  postcardFoot: {
    fontSize: 11,
    color: MUTED,
    marginTop: 10,
    textAlign: 'center',
  },
});
