import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

const WEB_RESET_PATH = '/reset-password';

function getSiteRedirectUri(webPath: string, nativePath: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${webPath}`;
  }
  return makeRedirectUri({
    scheme: 'floraison',
    path: nativePath,
  });
}

/** URL de retour après clic sur le lien de confirmation d'inscription. */
export function getEmailConfirmRedirectUri(): string {
  return getSiteRedirectUri('/', '');
}

/** URL de retour après clic sur le lien email Supabase (app mobile ou web Vercel). */
export function getPasswordResetRedirectUri(): string {
  return getSiteRedirectUri(WEB_RESET_PATH, 'reset-password');
}
