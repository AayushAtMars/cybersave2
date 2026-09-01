import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVerifyOtp, useSendOtp } from '../../src/api/auth';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import * as SecureStore from 'expo-secure-store';
import { sendFirebaseOtp, getActiveConfirmation, setActiveConfirmation } from '../../src/api/firebase';
import { shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OtpScreen() {
    const { t } = useTranslation();
  const {
    phone,
    devOtp,
    registerMode,
    regName,
    regEmail,
    regAadhaar,
    regState,
    regDistrict,
  } = useLocalSearchParams<{
    phone: string;
    devOtp?: string;
    registerMode?: string;
    regName?: string;
    regEmail?: string;
    regAadhaar?: string;
    regState?: string;
    regDistrict?: string;
  }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const refs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  const verifyOtp = useVerifyOtp();
  const sendOtp = useSendOtp();

  // Auto-fill OTP boxes when devOtp is present (dev mode)
  useEffect(() => {
    if (devOtp && devOtp.length === OTP_LENGTH) {
      setOtp(devOtp.split(''));
    }
  }, [devOtp]);

  // Countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const timerDisplay = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) refs.current[idx + 1]?.focus();
    if (!val && idx > 0) refs.current[idx - 1]?.focus();
    if (val && next.every(Boolean)) handleVerify(next.join(''));
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    if (otpCode.length !== OTP_LENGTH) return;
    try {
      let firebaseToken: string | undefined = undefined;

      const confirmation = getActiveConfirmation();

      if (confirmation) {
        // Verify code via Firebase Auth client-side
        const userCredential = await confirmation.confirm(otpCode);
        firebaseToken = await userCredential.user.getIdToken();
      }

      // Verify token/code with our backend
      const result = await verifyOtp.mutateAsync({ 
        phone, 
        otp: otpCode, 
        firebaseToken 
      } as any);
      
      // If we came from the registration screen directly, proceed with registration immediately
      if (registerMode === 'true') {
        const regRes = await apiClient.post('/auth/register', {
          phone,
          name: regName,
          email: regEmail || undefined,
          aadhaarNumber: regAadhaar || undefined,
          state: regState || undefined,
          district: regDistrict || undefined,
        });
        // Set auth using the registration response
        const { setAuth } = useAuthStore.getState();
        const data = regRes.data.data;
        setAuth(data.user, data.accessToken, data.refreshToken);
        
        // Save to SecureStore for biometrics
        await SecureStore.setItemAsync('user_session', JSON.stringify({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }));

        router.replace('/(tabs)/home');
        return;
      }

      // Save standard login credentials to SecureStore for biometrics
      await SecureStore.setItemAsync('user_session', JSON.stringify({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }));

      if (result.isNewUser) {
        router.replace({ pathname: '/(auth)/register', params: { phone } });
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      const serverError = err.response?.data?.error;
      Alert.alert('Verification Failed', serverError || err.message || 'Invalid code or authentication failed.');
      setOtp(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      const formattedPhone = `+91${phone}`;
      try {
        // Re-send via Firebase (real SMS)
        const confirmation = await sendFirebaseOtp(formattedPhone);
        setActiveConfirmation(confirmation);
      } catch (fbErr: any) {
        // Fallback to backend mock OTP
        await sendOtp.mutateAsync({ phone });
      }
      setTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const maskedPhone = phone
    ? '•'.repeat(6) + phone.slice(-4)
    : '••••••••••';


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Blue gradient header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={{ flex: 0 }} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('otp.verify_mobile')}</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

      {/* White card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('otp.verify_your_number')}</Text>
        <Text style={styles.cardSub}>
          
                            {t('otp.we_have_sent_a')} {OTP_LENGTH}{t('otp.digit_one_time_password_otp_to')}{phone ? phone.slice(-4) : '7890'}
        </Text>

        {/* Dev-mode banner */}
        {!!devOtp && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerLabel}>{t('otp.dev_mode_otp_auto_filled')}</Text>
            <Text style={styles.devBannerOtp}>{devOtp}</Text>
          </View>
        )}

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <TextInput
              key={i}
              ref={(r) => { refs.current[i] = r; }}
              style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}
              value={otp[i]}
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Resend + Change Number row */}
        <View style={styles.resendRow}>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text style={styles.resendText}>
              
                                        {t('otp.resend_otp_in')} <Text style={styles.resendTimer}>{timerDisplay}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.changeNumber}>{t('otp.change_number')}</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {verifyOtp.isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {(verifyOtp.error as any)?.response?.data?.error ?? 'Invalid OTP. Please try again.'}
            </Text>
          </View>
        )}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Verify & Proceed button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => handleVerify()}
          disabled={!otp.every(Boolean) || verifyOtp.isPending}
          activeOpacity={0.85}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={otp.every(Boolean) ? ['#1E3A8A', '#2563EB'] : ['#94A3B8', '#94A3B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>
              {verifyOtp.isPending ? 'Verifying…' : 'Verify & Proceed'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secured footer */}
        <View style={styles.securedRow}>
          <Ionicons name="lock-closed" size={14} color="#10B981" />
          <Text style={styles.securedText}>{t('otp.secured_by_national_identity_v')}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: -32,
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: 'System',
  },
  cardSub: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: 'System',
  },

  // OTP
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontFamily: 'System',
  },
  otpBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },

  // Resend row
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    fontFamily: 'System',
  },
  resendTimer: {
    fontWeight: '700',
    color: '#0F172A',
  },
  changeNumber: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
    fontFamily: 'System',
  },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },

  spacer: { flex: 1 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    gap: 20,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700',
    fontFamily: 'System',
  },

  // Secured strip
  securedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  securedText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Dev mode banner
  devBanner: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  devBannerLabel: {
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '600',
  },
  devBannerOtp: {
    fontSize: 26,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 8,
  },
});
