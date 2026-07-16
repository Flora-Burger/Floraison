import * as Linking from 'expo-linking';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthDeepLinkResult = 'recovery' | 'signup' | 'other' | null;

function collectParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    new URLSearchParams(hash).forEach((value, key) => {
      params[key] = value;
    });
  }

  const queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    const end = hashIndex >= 0 ? hashIndex : url.length;
    const query = url.slice(queryIndex + 1, end);
    new URLSearchParams(query).forEach((value, key) => {
      if (!(key in params)) params[key] = value;
    });
  }

  const parsed = Linking.parse(url);
  if (parsed.queryParams) {
    for (const [key, value] of Object.entries(parsed.queryParams)) {
      if (typeof value === 'string' && !(key in params)) {
        params[key] = value;
      }
    }
  }

  return params;
}

function mapLinkType(type: string | undefined): AuthDeepLinkResult {
  if (type === 'recovery') return 'recovery';
  if (type === 'signup' || type === 'email' || type === 'email_change') return 'signup';
  return 'other';
}

export async function handleAuthDeepLink(
  client: SupabaseClient,
  url: string,
): Promise<AuthDeepLinkResult> {
  if (!url.includes('access_token') && !url.includes('code=')) {
    return null;
  }

  const params = collectParams(url);
  const type = params.type;

  if (params.code) {
    const { error } = await client.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return mapLinkType(type);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return mapLinkType(type);
}
