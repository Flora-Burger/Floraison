import { useRef, useState } from 'react';
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ImageIcon, ShareNetwork } from 'phosphor-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { CycleData } from '../types/cycle';
import { buildFriendShareCard } from '../lib/cycleClose';
import { todayKey } from '../lib/dates';
import { alertAsync } from '../lib/confirmDialog';
import { BG_SOFT, BORDER, MUTED, ROSE_DEEP, TEXT } from '../constants/theme';
import { usePhaseAccent } from '../context/PhaseAccentContext';

type FriendShareCardProps = {
  data: CycleData;
};

export function FriendShareCardButton({ data }: FriendShareCardProps) {
  const { accent } = usePhaseAccent();
  const card = buildFriendShareCard(data, todayKey());
  const shotRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  if (!card) return null;

  const shareText = async () => {
    try {
      await Share.share({ message: `${card.title}\n\n${card.body}`, title: card.title });
    } catch {
      /* ignore */
    }
  };

  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (Platform.OS === 'web') {
        await shareText();
        await alertAsync(
          'Partage image',
          'Sur le web, le partage texte est utilisé — l’export image marche sur mobile.',
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
        await alertAsync('Image prête', `Enregistrée : ${fileUri}`);
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager la carte Floraison',
        UTI: 'public.png',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      await alertAsync('Partage impossible', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={[styles.card, { borderColor: accent.accent + '44' }]}
      accessibilityRole="summary"
      accessibilityLabel="Partage amie : carte anonyme de ta phase"
    >
      <Text style={styles.title} accessibilityRole="header">
        Partage amie
      </Text>
      <Text style={styles.hint}>
        Carte douce et anonyme — phase + message, sans dates ni symptômes.
      </Text>

      <View
        ref={shotRef}
        collapsable={false}
        style={[styles.shot, { borderColor: accent.accent + '55' }]}
        accessibilityRole="text"
        accessibilityLabel={card.body}
      >
        <Text style={[styles.shotBrand, { color: ROSE_DEEP }]} importantForAccessibility="no">
          Floraison
        </Text>
        <Text style={styles.shotBody} importantForAccessibility="no">
          {card.body}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accent.accent }]}
          onPress={() => void shareText()}
          accessibilityRole="button"
          accessibilityLabel="Partager en texte"
        >
          <ShareNetwork size={16} color="#FFFCF9" weight="bold" />
          <Text style={styles.btnText}>Texte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: accent.accent }]}
          onPress={() => void shareImage()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Partager en image"
        >
          <ImageIcon size={16} color={accent.accent} weight="bold" />
          <Text style={[styles.btnOutlineText, { color: accent.accent }]}>
            {busy ? '…' : 'Image'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BG_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 4 },
  hint: { fontSize: 12, color: MUTED, lineHeight: 17, marginBottom: 10 },
  shot: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    marginBottom: 12,
  },
  shotBrand: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  shotBody: { fontSize: 14, color: TEXT, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnText: { color: '#FFFCF9', fontWeight: '700', fontSize: 13 },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFCF9',
  },
  btnOutlineText: { fontWeight: '700', fontSize: 13 },
});
