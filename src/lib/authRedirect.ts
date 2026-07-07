import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

const WEB_RESET_PATH = '/reset-password';

/** URL de retour après clic sur le lien email Supabase (app mobile ou web Vercel). */
export function getPasswordResetRedirectUri(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${WEB_RESET_PATH}`;
  }
  return makeRedirectUri({
    scheme: 'floraison',
    path: 'reset-password',
  });
}
