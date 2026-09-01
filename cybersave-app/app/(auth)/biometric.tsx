import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export default function BiometricScreen() {
    const { t } = useTranslation();
  const triggerAuthentication = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrics Not Available',
          'Please ensure Fingerprint or Face ID is enabled and registered in your device settings.'
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Cybersave',
        fallbackLabel: 'Use PIN/Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Retrieve credentials saved during last successful login
        const storedCreds = await SecureStore.getItemAsync('user_session');
        if (storedCreds) {
          const { user, accessToken, refreshToken } = JSON.parse(storedCreds);
          const { setAuth } = useAuthStore.getState();
          setAuth(user, accessToken, refreshToken);
          router.replace('/(tabs)/home');
        } else {
          Alert.alert(
            'No Session Found',
            'Please log in using OTP first to link your fingerprint/Face ID.'
          );
          router.replace('/(auth)/login');
        }
      }
    } catch (err) {
      console.error('Biometric authentication failed:', err);
    }
  };

  useEffect(() => {
    // Prompt biometric authentication immediately on load
    const timer = setTimeout(() => {
      triggerAuthentication();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.flex}>
      {/* Top spacer */}
      <View style={styles.topSection}>
        {/* Cybersave Logo */}
        <Image
          source={require('../../assets/images/splash/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Center Biometric Touch Area */}
      <View style={styles.centerSection}>
        <TouchableOpacity
          style={styles.fingerprintRing}
          onPress={triggerAuthentication}
          activeOpacity={0.7}
        >
          <View style={styles.fingerprintInner}>
            <Ionicons name="finger-print-outline" size={54} color="#2563EB" />
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>{t('biometric.touch_to_login')}</Text>
        <Text style={styles.subtitle}>{t('biometric.place_your_registered_finger_o')}</Text>
      </View>

      {/* Bottom Option */}
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.otpLink}>{t('biometric.use_otp_instead')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },

  topSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logo: {
    width: width * 0.45,
    height: 80,
  },

  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  fingerprintRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  fingerprintInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  otpLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
    padding: 10,
  },
});
