import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useSendOtp } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { sendFirebaseOtp, setActiveConfirmation } from '../../src/api/firebase';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

const { height, width } = Dimensions.get('window');

/** Pure-RN fingerprint icon — concentric arcs via bordered half-circles */
function FingerprintIcon() {
  const C = '#2563EB';
  return (
    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outermost arc */}
      <View style={{
        position: 'absolute', width: 34, height: 34, borderRadius: 17,
        borderWidth: 2, borderColor: C, borderBottomColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
      }} />
      {/* Second arc */}
      <View style={{
        position: 'absolute', width: 26, height: 26, borderRadius: 13,
        borderWidth: 2, borderColor: C, borderBottomColor: 'transparent', borderLeftColor: 'transparent',
        transform: [{ rotate: '135deg' }],
      }} />
      {/* Third arc */}
      <View style={{
        position: 'absolute', width: 19, height: 19, borderRadius: 10,
        borderWidth: 2, borderColor: C, borderTopColor: 'transparent', borderRightColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
      }} />
      {/* Fourth arc */}
      <View style={{
        position: 'absolute', width: 12, height: 12, borderRadius: 6,
        borderWidth: 2, borderColor: C, borderTopColor: 'transparent', borderLeftColor: 'transparent',
        transform: [{ rotate: '135deg' }],
      }} />
      {/* Center dot */}
      <View style={{
        position: 'absolute', width: 4, height: 4, borderRadius: 2,
        backgroundColor: C,
      }} />
    </View>
  );
}

export default function LoginScreen() {
    const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendOtp = useSendOtp();
  const recaptchaRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  const handleSendOtp = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    const formattedPhone = `+91${phone}`;

    try {
      // 1. Try Firebase Phone Authentication (native SDK)
      const confirmation = await sendFirebaseOtp(formattedPhone);
      setActiveConfirmation(confirmation);

      setLoading(false);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone },
      });
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] Failed, falling back to backend OTP:', fbErr.message);

      // 2. Fall back to backend mock OTP delivery
      try {
        const result = await sendOtp.mutateAsync({ phone });
        setLoading(false);
        router.push({
          pathname: '/(auth)/otp',
          params: { phone, devOtp: result?.devOtp ?? '' },
        });
      } catch (err: any) {
        setLoading(false);
        Alert.alert('Error', err.response?.data?.error ?? 'Something went wrong. Try again.');
      }
    }
  };


  const handleBiometric = () => {
    router.push('/(auth)/biometric');
  };


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Blue gradient header */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView edges={['top']} style={{ flex: 0 }} />
          <Text style={styles.headerTitle}>{t('login.welcome_back')}</Text>
          <Text style={styles.headerSub}>{t('login.sign_in_to_safely_access_your_')}</Text>
        </LinearGradient>

        {/* White card container */}
        <View style={styles.card}>
          {/* Mobile Number label */}
          <Text style={styles.fieldLabel}>{t('login.mobile_number')}</Text>

          {/* Phone input */}
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              {/* Indian flag using vertically stacked colored view strips */}
              <View style={styles.flagContainer}>
                <View style={[styles.flagStripe, { backgroundColor: '#FF9933' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#138808' }]} />
              </View>
              <Text style={styles.countryCodeText}>{t('login.91')}</Text>
            </View>
            <View style={styles.dividerLineVertical} />
            <TextInput
              ref={inputRef}
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor="#CBD5E1"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          {/* Error */}
          {sendOtp.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {(sendOtp.error as any)?.response?.data?.error ?? 'Something went wrong. Try again.'}
              </Text>
            </View>
          )}

          {/* Send OTP button */}
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={!isValid || loading || sendOtp.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isValid ? ['#1E3A8A', '#2563EB'] : ['#94A3B8', '#94A3B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.sendOtpBtn, (loading || sendOtp.isPending) && { opacity: 0.6 }]}
            >
              <Text style={styles.sendOtpText}>
                {loading || sendOtp.isPending ? 'Sending…' : 'Send OTP'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Fingerprint / Face ID */}
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometric}
            activeOpacity={0.75}
          >
            <View style={styles.biometricIconWrap}>
              <FingerprintIcon />
            </View>
            <Text style={styles.biometricText}>{t('login.login_with_fingerprint_face_id')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t('login.new_user')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>{t('login.register_now')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    paddingTop: 58,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 26,
    fontWeight: '800',
    color: '#E3E3EA',
    marginBottom: 6,
  },
  headerSub: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#BFDBFE',
    fontWeight: '400',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -32,
    marginHorizontal: 20,
    padding: 24,
    flex: 1,
    gap: 20,
    ...shadows.sm,
  },

  // Field label
  fieldLabel: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: -12, // offset standard gap
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 48,
    paddingHorizontal: 16,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagContainer: {
    flexDirection: 'column',
    borderRadius: 2,
    overflow: 'hidden',
    width: 24,
    height: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  flagStripe: {
    width: 24,
    height: 5.3,
  },
  countryCodeText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  dividerLineVertical: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    letterSpacing: 1.2,
    height: '100%',
    padding: 0,
  },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: { color: '#DC2626', fontSize: 13 },

  // Send OTP button
  sendOtpBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    fontFamily: 'System',
  },

  // Biometric
  biometricBtn: {
    alignItems: 'center',
    gap: 12,
  },
  biometricIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  registerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'System',
  },
  registerLink: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
    fontFamily: 'System',
  },
});
