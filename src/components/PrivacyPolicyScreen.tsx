import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED,
} from '../constants/privacyPolicy';
import { BG, BORDER, CARD, MUTED, ROSE_DEEP, TEXT } from '../constants/theme';

type PrivacyPolicyScreenProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyPolicyScreen({ visible, onClose }: PrivacyPolicyScreenProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Politique de confidentialité</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.updated}>Dernière mise à jour : {PRIVACY_POLICY_UPDATED}</Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.intro}>
            Floraison traite des données personnelles, dont certaines peuvent être sensibles (suivi
            menstruel). Cette politique explique ce que nous collectons, pourquoi, et comment exercer
            vos droits.
          </Text>

          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          <Text style={styles.contact}>
            Contact confidentialité : {PRIVACY_CONTACT_EMAIL}
          </Text>
        </ScrollView>

        <Pressable style={styles.footerBtn} onPress={onClose}>
          <Text style={styles.footerBtnText}>Fermer</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
  },
  title: { fontSize: 18, fontWeight: '700', color: ROSE_DEEP, flex: 1, paddingRight: 12 },
  close: { fontSize: 22, color: MUTED, padding: 4 },
  updated: {
    fontSize: 12,
    color: MUTED,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  intro: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 21,
    marginBottom: 16,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ROSE_DEEP,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: TEXT,
    lineHeight: 21,
  },
  contact: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  footerBtn: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: ROSE_DEEP,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerBtnText: { color: '#FFFCF9', fontSize: 16, fontWeight: '700' },
});
