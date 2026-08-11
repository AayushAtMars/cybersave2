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
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { useSendOtp } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { sendFirebaseOtp, setActiveConfirmation } from '../../src/api/firebase';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';

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
      <StatusBar barStyle="light-content" backgroundColor="#1A4DB5" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Blue gradient header */}
        <LinearGradient
          colors={['#1A4DB5', '#2B6FE6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSub}>Sign in to safely access your e-gov portal</Text>
        </LinearGradient>

        {/* White card */}
        <View style={styles.card}>
          {/* Mobile Number label */}
          <Text style={styles.fieldLabel}>Mobile Number</Text>

          {/* Phone input */}
          <View style={styles.phoneRow}>
            {/* Indian flag using colored view strips */}
            <View style={styles.countryCode}>
              <View style={styles.flagContainer}>
                <View style={[styles.flagStripe, { backgroundColor: '#FF9933' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.flagStripe, { backgroundColor: '#138808' }]} />
              </View>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
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
            <Text style={styles.dividerText}>or</Text>
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
            <Text style={styles.biometricText}>Login with Fingerprint / Face ID</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>New user? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    paddingTop: 70,
    paddingBottom: 56,
    paddingHorizontal: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '400',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
    flex: 1,
    ...shadows.lg,
  },

  // Field label
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },

  // Phone row
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  flagContainer: {
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    width: 22,
    height: 16,
  },
  flagStripe: {
    flex: 1,
    height: 16,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 17,
    color: '#0F172A',
    letterSpacing: 1.2,
  },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: { color: '#DC2626', fontSize: 13 },

  // Send OTP button
  sendOtpBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 28,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Biometric
  biometricBtn: {
    alignItems: 'center',
    gap: 10,
  },
  biometricIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#F5F7FA',
  },
  registerText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
