import { useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

// Environment variables for Google OAuth
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

// Debug: Log configuration on load
console.log('[GoogleAuth] Configuration:', {
  webClientId: GOOGLE_WEB_CLIENT_ID ? `${GOOGLE_WEB_CLIENT_ID.slice(0, 20)}...` : 'NOT SET',
  androidClientId: GOOGLE_ANDROID_CLIENT_ID ? `${GOOGLE_ANDROID_CLIENT_ID.slice(0, 20)}...` : 'NOT SET',
  appOwnership: Constants.appOwnership,
  executionEnvironment: Constants.executionEnvironment,
});

export interface GoogleAuthResult {
  type: 'success' | 'error' | 'cancel';
  code?: string;
  codeVerifier?: string;
  redirectUri?: string;
  error?: string;
}

export interface UseGoogleAuthReturn {
  request: Google.GoogleAuthRequestConfig | null;
  promptAsync: () => Promise<GoogleAuthResult>;
  isReady: boolean;
  redirectUri: string;
}

/**
 * Hook for Google OAuth authentication
 *
 * For EAS development builds:
 * - Uses native Google Sign-In with Android client ID
 * - Redirect is handled via app scheme (bigboy://)
 *
 * For Expo Go (fallback):
 * - Uses Expo's auth proxy (auth.expo.io)
 * - Less reliable on Android, may show "dismiss"
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
  // Determine if we're in Expo Go or a standalone/dev build
  const isExpoGo = Constants.appOwnership === 'expo';

  // Build the redirect URI based on environment
  const redirectUri = isExpoGo
    ? AuthSession.makeRedirectUri({
        useProxy: true,
        projectNameForProxy: 'ojazaerly/bigboy-app',
      })
    : AuthSession.makeRedirectUri({
        scheme: 'com.bigboy.app',
        path: 'oauthredirect',
      });

  console.log('[GoogleAuth] Redirect URI:', redirectUri);
  console.log('[GoogleAuth] Is Expo Go:', isExpoGo);

  // Configure Google auth request
  const [request, response, promptAsyncBase] = Google.useAuthRequest({
    // Web client ID is used for Expo Go proxy
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // Android client ID for development builds
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    // iOS client ID for iOS builds (if present)
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    // Authorization Code + PKCE for dev client
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    shouldAutoExchangeCode: false,
  });

  // Log request details when ready
  useEffect(() => {
    if (request) {
      console.log('[GoogleAuth] Request ready:', {
        url: request.url?.slice(0, 200) + '...',
        codeChallenge: request.url?.includes('code_challenge=') ? 'present' : 'missing',
        redirectUri: request.redirectUri,
      });
    }
  }, [request]);

  // Log response when received
  useEffect(() => {
    if (response) {
      console.log('[GoogleAuth] Response received:', {
        type: response.type,
        params: response.type === 'success' ? Object.keys(response.params || {}) : undefined,
        error: response.type === 'error' ? response.error : undefined,
      });
    }
  }, [response]);

  // Wrapped promptAsync that returns a consistent result
  const promptAsync = useCallback(async (): Promise<GoogleAuthResult> => {
    if (!request) {
      console.log('[GoogleAuth] Request not ready');
      return { type: 'error', error: 'Auth request not initialized' };
    }

    console.log('[GoogleAuth] Starting auth flow...');

    try {
      const result = await promptAsyncBase({ useProxy: isExpoGo });

      console.log('[GoogleAuth] Auth result:', {
        type: result.type,
        hasParams: result.type === 'success' && !!result.params,
        paramsKeys: result.type === 'success' ? Object.keys(result.params || {}) : undefined,
      });

      if (result.type === 'success') {
        const { code } = result.params;
        const codeVerifier = request?.codeVerifier;

        console.log('[GoogleAuth] Success! Code received:', {
          hasCode: !!code,
          hasCodeVerifier: !!codeVerifier,
        });

        return {
          type: 'success',
          code,
          codeVerifier,
          redirectUri,
        };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[GoogleAuth] User cancelled/dismissed');
        return { type: 'cancel' };
      }

      if (result.type === 'error') {
        console.log('[GoogleAuth] Error:', result.error);
        return { type: 'error', error: result.error?.message || 'Unknown error' };
      }

      return { type: 'error', error: 'Unknown response type' };
    } catch (error) {
      console.error('[GoogleAuth] Exception:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [request, promptAsyncBase]);

  return {
    request: request as Google.GoogleAuthRequestConfig | null,
    promptAsync,
    isReady: !!request,
    redirectUri,
  };
}

export default useGoogleAuth;
