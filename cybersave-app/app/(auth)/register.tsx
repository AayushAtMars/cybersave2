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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { sendFirebaseOtp, setActiveConfirmation } from '../../src/api/firebase';
import { shadows } from '../../src/theme';
import { STATE_DISTRICTS } from '../../src/utils/districtsData';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

// ── Indian States ────────────────────────────────────────────────────────────


// Simple dropdown (sheet-style) component
function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownItem, value === opt && styles.dropdownItemActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.dropdownItemText, value === opt && styles.dropdownItemTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function RegisterScreen() {
    const { t } = useTranslation();
  const { phone: phoneParam } = useLocalSearchParams<{ phone: string }>();
  // phoneInput is used when user lands on register directly (no OTP param)
  const [phoneInput, setPhoneInput] = useState('');
  // The resolved phone — prefer param (verified via OTP), else local input
  const phone = phoneParam || phoneInput;
  const phoneIsLocked = !!phoneParam; // pre-filled & verified → lock it

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  const handleStateSelect = (s: string) => {
    setState(s);
    setDistrict(''); // reset district when state changes
  };
  const [sendingOtp, setSendingOtp] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const recaptchaRef = useRef<any>(null);

  const register = useMutation({
    mutationFn: (data: {
      name: string;
      email?: string;
      aadhaarNumber?: string;
      state?: string;
      district?: string;
    }) =>
      apiClient
        .post('/auth/register', { phone, ...data })
        .then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/home');
    },
  });

  const isValid =
    name.trim().length >= 2 &&
    agreed &&
    (!phoneIsLocked ? /^[6-9]\d{9}$/.test(phoneInput) : true);

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A4DB5" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Blue gradient header */}
        <LinearGradient
          colors={['#1A4DB5', '#2B6FE6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('register.create_account')}</Text>
        </LinearGradient>

        {/* White card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('register.join_cybersave')}</Text>
          <Text style={styles.cardSub}>
            
                                  {t('register.sign_up_to_access_direct_benef')}
                                </Text>

          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.full_name_as_in_aadhaar')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Aarav Sharma"
              placeholderTextColor="#CBD5E1"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              textContentType="name"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.phone_number')}</Text>
            <View style={[styles.phoneRow, phoneIsLocked && styles.phoneRowLocked]}>
              <View style={styles.countryCode}>
                <View style={styles.flagContainer}>
                  <View style={[styles.flagStripe, { backgroundColor: '#FF9933' }]} />
                  <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
                  <View style={[styles.flagStripe, { backgroundColor: '#138808' }]} />
                </View>
                <Text style={styles.countryCodeText}>{t('register.91')}</Text>
              </View>
              {phoneIsLocked ? (
                // Read-only: phone was verified via OTP
                <Text style={styles.phoneDisplay}>
                  {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
                </Text>
              ) : (
                // Editable: user came directly to register screen
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#CBD5E1"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  returnKeyType="done"
                />
              )}
            </View>
            {!phoneIsLocked && phoneInput.length > 0 && !/^[6-9]\d{9}$/.test(phoneInput) && (
              <Text style={styles.phoneHint}>{t('register.enter_a_valid_10_digit_mobile_')}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.email_id_optional')}</Text>
            <TextInput
              style={styles.input}
              placeholder="aarav.sharma@example.com"
              placeholderTextColor="#CBD5E1"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />
          </View>

          {/* Aadhaar */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.aadhaar_number_optional')}</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012"
              placeholderTextColor="#CBD5E1"
              value={aadhaar}
              onChangeText={(v) => setAadhaar(formatAadhaar(v))}
              keyboardType="number-pad"
              maxLength={14}
            />
          </View>

          {/* State + District */}
          <View style={styles.rowFields}>
            <Dropdown
              label="State"
              value={state}
              options={Object.keys(STATE_DISTRICTS)}
              onSelect={handleStateSelect}
              placeholder="Select State"
            />
            <View style={{ width: 12 }} />
            <Dropdown
              label="District"
              value={district}
              options={state ? (STATE_DISTRICTS[state] ?? []) : []}
              onSelect={setDistrict}
              placeholder={state ? 'Select District' : 'Select State first'}
            />
          </View>

          {/* T&C */}
          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.75}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.agreeText}>
              
                                        {t('register.i_agree_to_the_national_e_gove')}
                                      </Text>
          </TouchableOpacity>

          {/* Error */}
          {register.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {(register.error as any)?.response?.data?.error ?? 'Registration failed. Please try again.'}
              </Text>
            </View>
          )}

          {/* Create Account button */}
          <TouchableOpacity
            onPress={async () => {
              if (sendingOtp || register.isPending) return;

              const registerPayload = {
                name: name.trim(),
                email: email.trim() || undefined,
                aadhaarNumber: aadhaar.replace(/\s/g, '') || undefined,
                state: state || undefined,
                district: district.trim() || undefined,
              };

              if (!phoneIsLocked) {
                // Not verified yet! Must send OTP first.
                setSendingOtp(true);

                const formattedPhone = `+91${phoneInput}`;

                try {
                  // 1. Try Firebase Phone Authentication (native SDK)
                  const confirmation = await sendFirebaseOtp(formattedPhone);
                  setActiveConfirmation(confirmation);

                  setSendingOtp(false);
                  router.push({
                    pathname: '/(auth)/otp',
                    params: {
                      phone: phoneInput,
                      // Pass registration data so we register after OTP verification
                      registerMode: 'true',
                      regName: registerPayload.name,
                      regEmail: registerPayload.email ?? '',
                      regAadhaar: registerPayload.aadhaarNumber ?? '',
                      regState: registerPayload.state ?? '',
                      regDistrict: registerPayload.district ?? '',
                    },
                  });
                } catch (fbErr: any) {
                  console.warn('[Firebase Auth] Failed, falling back to backend OTP:', fbErr.message);

                  // 2. Fall back to backend mock OTP delivery
                  try {
                    const result = await apiClient.post('/auth/send-otp', { phone: phoneInput });
                    const devOtp = result.data?.data?.devOtp ?? '';
                    setSendingOtp(false);
                    router.push({
                      pathname: '/(auth)/otp',
                      params: {
                        phone: phoneInput,
                        devOtp,
                        registerMode: 'true',
                        regName: registerPayload.name,
                        regEmail: registerPayload.email ?? '',
                        regAadhaar: registerPayload.aadhaarNumber ?? '',
                        regState: registerPayload.state ?? '',
                        regDistrict: registerPayload.district ?? '',
                      },
                    });
                  } catch (err: any) {
                    setSendingOtp(false);
                    Alert.alert('Error', err.response?.data?.error ?? 'Failed to send verification OTP.');
                  }
                }
              } else {
                // Already verified! Complete registration.
                register.mutate(registerPayload);
              }
            }}
            disabled={!isValid || register.isPending || sendingOtp}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isValid ? ['#1E3A8A', '#2563EB'] : ['#94A3B8', '#94A3B8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaText}>
                {register.isPending || sendingOtp ? 'Verifying…' : (phoneIsLocked ? 'Create Account' : 'Verify & Register')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t('register.already_have_an_account')} </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>{t('register.login')}</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    flexDirection: 'column',
    gap: 16,
  },
  backBtn: { marginBottom: 0 },
  backIcon: { fontSize: 22, color: '#FFFFFF' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: -28,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
    ...shadows.lg,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 20,
  },

  // Fields
  field: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  // Phone row (display only — not editable)
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  phoneRowLocked: {
    backgroundColor: '#F8FAFC',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  flagContainer: {
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    width: 20,
    height: 14,
  },
  flagStripe: { flex: 1, height: 14 },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  phoneDisplay: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 1,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 1,
  },
  phoneHint: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },


  // Row fields (State + District)
  rowFields: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: { fontSize: 15, color: '#0F172A', flex: 1 },
  dropdownPlaceholder: { color: '#CBD5E1' },
  dropdownArrow: { fontSize: 10, color: '#94A3B8', marginLeft: 6 },
  dropdownList: {
    maxHeight: 180,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownItemText: { fontSize: 14, color: '#0F172A' },
  dropdownItemTextActive: { color: '#2563EB', fontWeight: '600' },

  // T&C
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  agreeText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: { color: '#DC2626', fontSize: 13 },

  // CTA
  ctaBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F5F7FA',
  },
  loginText: { fontSize: 14, color: '#64748B' },
  loginLink: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
});
