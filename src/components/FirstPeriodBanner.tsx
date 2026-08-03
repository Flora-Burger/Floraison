import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarBlank, Leaf } from 'phosphor-react-native';
import { BG_SOFT, BORDER, MUTED, ROSE, TEXT } from '../constants/theme';

type FirstPeriodBannerProps = {
  onStartOnboarding: () => void;
};

/** Bannière Suivi si aucun début de règles — invite à l’onboarding rapide. */
export function FirstPeriodBanner({ onStartOnboarding }: FirstPeriodBannerProps) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <Leaf size={22} weight="duotone" color={ROSE} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Active ton cycle</Text>
        <Text style={styles.body}>
          Indique le début de tes dernières règles pour afficher ta phase et
          les prédictions.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={onStartOnboarding}
          accessibilityRole="button"
        >
          <CalendarBlank size={16} weight="bold" color="#FFFCF9" />
          <Text style={styles.btnText}>Choisir la date</Text>
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
    borderColor: ROSE + '44',
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ROSE + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    marginBottom: 10,
  },
  btn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ROSE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFCF9',
  },
});
