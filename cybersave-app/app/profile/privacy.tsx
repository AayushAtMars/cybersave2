import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { colors, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

export default function PrivacySecurityScreen() {
    const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Consent states
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [sharingConsent, setSharingConsent] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch latest profile containing sessions on mount
  useEffect(() => {
    const loadConsentsAndProfile = async () => {
      try {
        const analyticsVal = await SecureStore.getItemAsync('consent_analytics');
        if (analyticsVal !== null) {
          setAnalyticsConsent(analyticsVal === 'true');
        }

        const sharingVal = await SecureStore.getItemAsync('consent_sharing');
        if (sharingVal !== null) {
          setSharingConsent(sharingVal === 'true');
        }
      } catch (err) {
        console.warn('Failed to load consents:', err);
      }

      try {
        const res = await apiClient.patch('/auth/profile', {});
        if (res.data?.success && res.data?.data?.user) {
          updateUser(res.data.data.user);
        }
      } catch (err) {
        console.warn('Failed to fetch profile sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    loadConsentsAndProfile();
  }, []);

  const handleAnalyticsToggle = async (value: boolean) => {
    try {
      await SecureStore.setItemAsync('consent_analytics', value ? 'true' : 'false');
      setAnalyticsConsent(value);
    } catch {
      Alert.alert('Error', 'Failed to save consent choice.');
    }
  };

  const handleSharingToggle = async (value: boolean) => {
    try {
      await SecureStore.setItemAsync('consent_sharing', value ? 'true' : 'false');
      setSharingConsent(value);
    } catch {
      Alert.alert('Error', 'Failed to save consent choice.');
    }
  };

  const handleDownloadData = () => {
    setSuccessMsg('Your digital identity records have been compiled into a secure ZIP archive and downloaded to your files.');
    setShowSuccessModal(true);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to temporarily deactivate your account? You can reactivate it anytime by logging back in with OTP.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete credentials but preserve settings
              await SecureStore.deleteItemAsync('user_session');
              clearAuth();
              router.replace('/(onboarding)/splash');
            } catch (err) {
              Alert.alert('Error', 'Failed to process deactivation.');
            }
          },
        },
      ]
    );
  };

  // Sort sessions: newest active session at index 0
  const activeSessions = [...(user?.sessions || [])].sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );

  return (
    <View style={styles.flex}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('privacy.privacy_security')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Main Container */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.whiteCardContainer}>
          {/* Security Shield Card */}
          <View style={styles.shieldCard}>
            <View style={styles.shieldIconBox}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            </View>
            <View style={styles.shieldInfo}>
              <Text style={styles.shieldTitle}>{t('privacy.security_shield_active')}</Text>
              <Text style={styles.shieldSub}>
                
                                              {t('privacy.your_digital_assets_and_person')}
                                            </Text>
            </View>
          </View>

          {/* Consent Management Section */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{t('privacy.consent_management')}</Text>
          </View>
          <View style={styles.sectionCard}>
            {/* Option: Analytics */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{t('privacy.analytics_consent')}</Text>
                <Text style={styles.optionDesc}>{t('privacy.allow_anonymous_diagnostic_rep')}</Text>
              </View>
              <Switch
                value={analyticsConsent}
                onValueChange={handleAnalyticsToggle}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            {/* Option: Third-Party Sharing */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{t('privacy.third_party_sharing')}</Text>
                <Text style={styles.optionDesc}>{t('privacy.share_verified_tags_with_offic')}</Text>
              </View>
              <Switch
                value={sharingConsent}
                onValueChange={handleSharingToggle}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Active Sessions Section */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{t('privacy.active_sessions')}</Text>
          </View>
          <View style={styles.sessionsCard}>
            {loadingSessions ? (
              <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 12 }} />
            ) : activeSessions.length === 0 ? (
              <View style={styles.emptySessionWrapper}>
                <Text style={styles.emptySessionText}>{t('privacy.no_active_sessions_found')}</Text>
              </View>
            ) : (
              activeSessions.map((session, index) => {
                const isCurrentDevice = index === 0;
                const formattedDate = new Date(session.lastActive).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <View 
                    key={session.id || index} 
                    style={[
                      styles.sessionRow, 
                      index > 0 && styles.sessionBorderTop
                    ]}
                  >
                    <View style={styles.sessionRowTop}>
                      <Text style={styles.sessionDevice} numberOfLines={1}>
                        {session.device} {isCurrentDevice ? '(This device)' : ''}
                      </Text>
                      <Text style={isCurrentDevice ? styles.activeLabel : styles.timeLabel}>
                        {isCurrentDevice ? 'Active now' : formattedDate}
                      </Text>
                    </View>
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Buttons */}
          <View style={styles.btnGroup}>
            {/* Download Data */}
            <TouchableOpacity 
              style={styles.downloadBtn} 
              activeOpacity={0.8}
              onPress={handleDownloadData}
            >
              <Text style={styles.downloadBtnText}>{t('privacy.download_my_digital_data')}</Text>
            </TouchableOpacity>

            {/* Deactivate Account */}
            <TouchableOpacity 
              style={styles.deactivateBtn} 
              activeOpacity={0.8}
              onPress={handleDeactivate}
            >
              <Text style={styles.deactivateBtnText}>{t('privacy.deactivate_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconOuter}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>{t('privacy.export_completed')}</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>{t('privacy.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 25,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -32,
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  whiteCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
    width: '100%',
  },
  shieldCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    alignSelf: 'stretch',
  },
  shieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldInfo: {
    flex: 1,
    gap: 2,
  },
  shieldTitle: {
    fontFamily: 'Manrope',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
  },
  shieldSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 13,
  },
  sectionHeaderContainer: {
    alignSelf: 'stretch',
  },
  sectionHeader: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    alignSelf: 'stretch',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
    gap: 2,
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 17,
  },
  optionDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  sessionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignSelf: 'stretch',
  },
  emptySessionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptySessionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
  },
  sessionRow: {
    alignSelf: 'stretch',
    gap: 4,
  },
  sessionBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 12,
    paddingTop: 12,
  },
  sessionRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDevice: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
    flex: 1,
    marginRight: 8,
  },
  sessionLocation: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 13,
  },
  activeLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    lineHeight: 13,
  },
  timeLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 13,
  },
  btnGroup: {
    gap: 12,
    alignSelf: 'stretch',
  },
  downloadBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
  },
  downloadBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 18,
  },
  deactivateBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  deactivateBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 18,
  },

  // Success Modal styling
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
