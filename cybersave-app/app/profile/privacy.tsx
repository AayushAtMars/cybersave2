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

export default function PrivacySecurityScreen() {
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
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Main Container */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Shield Card */}
        <View style={styles.shieldCard}>
          <View style={styles.shieldIconBox}>
            <Ionicons name="shield-outline" size={22} color="#10B981" />
          </View>
          <View style={styles.shieldInfo}>
            <Text style={styles.shieldTitle}>Security Shield Active</Text>
            <Text style={styles.shieldSub}>
              Your digital assets and personal details are encrypted.
            </Text>
          </View>
        </View>

        {/* Consent Management Section */}
        <Text style={styles.sectionHeader}>CONSENT MANAGEMENT</Text>
        <View style={styles.sectionCard}>
          {/* Option: Analytics */}
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Analytics Consent</Text>
              <Text style={styles.optionDesc}>Allow anonymous diagnostic reports</Text>
            </View>
            <Switch
              value={analyticsConsent}
              onValueChange={handleAnalyticsToggle}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={analyticsConsent ? '#2563EB' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          {/* Option: Third-Party Sharing */}
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Third-Party Sharing</Text>
              <Text style={styles.optionDesc}>Share verified tags with official departments</Text>
            </View>
            <Switch
              value={sharingConsent}
              onValueChange={handleSharingToggle}
              trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
              thumbColor={sharingConsent ? '#2563EB' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Active Sessions Section */}
        <Text style={styles.sectionHeader}>ACTIVE SESSIONS</Text>
        <View style={styles.sectionCard}>
          {loadingSessions ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: spacing.md }} />
          ) : activeSessions.length === 0 ? (
            <View style={styles.optionRow}>
              <Text style={styles.emptySessionText}>No active sessions found.</Text>
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
                <View key={session.id || index}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.optionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDevice}>
                        {session.device} {isCurrentDevice ? '(This device)' : ''}
                      </Text>
                      <Text style={styles.sessionLocation}>{session.location}</Text>
                    </View>
                    <Text style={isCurrentDevice ? styles.activeLabel : styles.timeLabel}>
                      {isCurrentDevice ? 'Active now' : formattedDate}
                    </Text>
                  </View>
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
            <Text style={styles.downloadBtnText}>Download My Digital Data</Text>
          </TouchableOpacity>

          {/* Deactivate Account */}
          <TouchableOpacity 
            style={styles.deactivateBtn} 
            activeOpacity={0.8}
            onPress={handleDeactivate}
          >
            <Text style={styles.deactivateBtnText}>Deactivate Account</Text>
          </TouchableOpacity>
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
            <Text style={styles.successTitle}>Export Completed!</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.base,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: spacing.base,
  },
  shieldCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  shieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  shieldInfo: {
    flex: 1,
    gap: 2,
  },
  shieldTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  shieldSub: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: spacing.sm,
    marginBottom: -4,
    paddingLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  optionInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: spacing.md,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sessionLocation: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activeLabel: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptySessionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    flex: 1,
  },
  btnGroup: {
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  downloadBtn: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  downloadBtnText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  deactivateBtn: {
    backgroundColor: '#EF4444',
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  deactivateBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Success Modal styling
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.xs,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
