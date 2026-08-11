import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const checkBiometric = async () => {
      try {
        const enabled = await SecureStore.getItemAsync('biometric_enabled');
        const session = await SecureStore.getItemAsync('user_session');
        
        if (enabled === 'true' && session) {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            const authResult = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Unlock Cybersave',
              fallbackLabel: 'Use PIN/Password',
              disableDeviceFallback: false,
            });

            if (authResult.success && active) {
              const { user, accessToken, refreshToken } = JSON.parse(session);
              useAuthStore.getState().setAuth(user, accessToken, refreshToken);
              router.replace('/(tabs)/home');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Biometric auto-login failed:', err);
      }

      // Fallback
      if (active) {
        if (isAuthenticated) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(onboarding)/splash');
        }
      }
    };

    checkBiometric();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return null;
}
