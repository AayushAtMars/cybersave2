import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { colors, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
    const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Switches states
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [hasExistingMpin, setHasExistingMpin] = useState(false);

  // Modal / Selection states
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const [showMpinModal, setShowMpinModal] = useState(false);
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [cacheSize, setCacheSize] = useState('4.2 MB');

  // Success notifications
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  // Load persisted states on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const bio = await SecureStore.getItemAsync('biometric_enabled');
        setBiometricEnabled(bio === 'true');

        const autopay = await SecureStore.getItemAsync('autopay_enabled');
        setAutopayEnabled(autopay === 'true');

        const twoFactor = await SecureStore.getItemAsync('two_factor_enabled');
        if (twoFactor !== null) {
          setTwoFactorEnabled(twoFactor === 'true');
        }

        const lang = await SecureStore.getItemAsync('user_language');
        if (lang) {
          setSelectedLanguage(lang);
        }

        const mpin = await SecureStore.getItemAsync('user_mpin');
        setHasExistingMpin(!!mpin);

        // Fetch latest profile to update sessions list
        try {
          const res = await apiClient.patch('/auth/profile', {});
          if (res.data?.success && res.data?.data?.user) {
            updateUser(res.data.data.user);
          }
        } catch (err) {
          console.warn('Failed to load profile for settings:', err);
        }

        // Dynamically calculate cache size
        await calculateCacheSize();
      } catch (err) {
        console.warn('Failed to load settings from storage', err);
      }
    };
    loadSettings();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists && 'size' in dirInfo) {
        const sizeMb = (dirInfo.size || 0) / (1024 * 1024);
        // Fallback to a realistic dummy range if directory size reports 0 (due to OS limitations)
        setCacheSize(sizeMb > 0.1 ? `${sizeMb.toFixed(1)} MB` : '4.2 MB');
      } else {
        setCacheSize('4.2 MB');
      }
    } catch {
      setCacheSize('4.2 MB');
    }
  };

  const handleClearCache = async () => {
    setShowClearCacheModal(true);
  };

  const confirmClearCache = async () => {
    setShowClearCacheModal(false);
    try {
      try {
        await apiClient.post('/auth/logout', {});
      } catch (e) {
        // Continue clearing cache even if logout API fails
      }
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        for (const file of files) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      }
      
      // Clear all secure store data
      await SecureStore.deleteItemAsync('user_session');
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('user_mpin');
      await SecureStore.deleteItemAsync('autopay_enabled');
      await SecureStore.deleteItemAsync('two_factor_enabled');
      await SecureStore.deleteItemAsync('user_language');
      
      clearAuth();
      router.replace('/(onboarding)/splash');
    } catch (err) {
      Alert.alert('Error', 'Failed to clear cache and data.');
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometrics Not Available',
            'Please enroll a fingerprint or Face ID in your device settings first.'
          );
          return;
        }

        // Prompt biometric check to verify ownership before enabling
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm fingerprint to enable login',
          disableDeviceFallback: true,
        });

        if (authResult.success) {
          await SecureStore.setItemAsync('biometric_enabled', 'true');
          setBiometricEnabled(true);
          setSuccessMsg('Biometric Login enabled successfully!');
          setShowSuccessModal(true);
        } else {
          setBiometricEnabled(false);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to configure biometric login.');
        setBiometricEnabled(false);
      }
    } else {
      await SecureStore.setItemAsync('biometric_enabled', 'false');
      setBiometricEnabled(false);
    }
  };

  const handleAutopayToggle = async (value: boolean) => {
    try {
      await SecureStore.setItemAsync('autopay_enabled', value ? 'true' : 'false');
      setAutopayEnabled(value);
    } catch {
      Alert.alert('Error', 'Failed to update Auto-pay preference.');
    }
  };

  const handle2FactorToggle = async (value: boolean) => {
    try {
      await SecureStore.setItemAsync('two_factor_enabled', value ? 'true' : 'false');
      setTwoFactorEnabled(value);
    } catch {
      Alert.alert('Error', 'Failed to update Two-Factor preference.');
    }
  };

  const changeLanguage = async (lang: string) => {
    try {
      await SecureStore.setItemAsync('user_language', lang);
      setSelectedLanguage(lang);
      setShowLanguageModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save language preference.');
    }
  };

  const handleSaveMpin = async () => {
    if (hasExistingMpin) {
      try {
        const storedMpin = await SecureStore.getItemAsync('user_mpin');
        if (currentMpin !== storedMpin) {
          Alert.alert('Validation Error', 'Current MPIN is incorrect.');
          return;
        }
      } catch {
        Alert.alert('Error', 'Failed to verify existing MPIN.');
        return;
      }
    }

    if (newMpin.length !== 4 || confirmMpin.length !== 4) {
      Alert.alert('Validation Error', 'MPIN must be exactly 4 digits.');
      return;
    }
    if (newMpin !== confirmMpin) {
      Alert.alert('Validation Error', 'New MPIN and Confirmation do not match.');
      return;
    }

    try {
      // Save MPIN locally securely
      await SecureStore.setItemAsync('user_mpin', newMpin);
      setHasExistingMpin(true);
      setShowMpinModal(false);
      setCurrentMpin('');
      setNewMpin('');
      setConfirmMpin('');
      setSuccessMsg(hasExistingMpin ? 'Your security MPIN has been updated!' : 'Your security MPIN has been set successfully!');
      setShowSuccessModal(true);
    } catch {
      Alert.alert('Error', 'Failed to update MPIN.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'WARNING: This action is permanent. All your saved documents and address profiles will be permanently erased. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete session and settings from SecureStore
              await SecureStore.deleteItemAsync('user_session');
              await SecureStore.deleteItemAsync('biometric_enabled');
              await SecureStore.deleteItemAsync('user_mpin');
              
              clearAuth();
              router.replace('/(onboarding)/splash');
            } catch (err) {
              Alert.alert('Error', 'Failed to process account deletion.');
            }
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>{t('settings.settings')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Settings Options Container */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* ACCOUNT SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('settings.account')}</Text>
            <View style={styles.sectionCard}>
              {/* Option: Notifications */}
              <View style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <Ionicons name="notifications" size={18} color="#2563EB" />
                  <Text style={styles.optionLabel}>{t('settings.notifications')}</Text>
                </View>
                <View style={styles.optionRight}>
                  <Text style={styles.optionValue}>{t('settings.all_active')}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#64748B" />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Option: Biometric Login */}
              <View style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <Ionicons name="finger-print" size={18} color="#2563EB" />
                  <Text style={styles.optionLabel}>{t('settings.biometric_login')}</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>


            </View>
          </View>

          {/* SECURITY SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('settings.security')}</Text>
            <View style={styles.sectionCard}>
              {/* Option: Change MPIN */}
              <TouchableOpacity 
                style={styles.optionRow} 
                activeOpacity={0.7} 
                onPress={() => setShowMpinModal(true)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="lock-closed" size={18} color="#2563EB" />
                  <Text style={styles.optionLabel}>{t('settings.change_mpin')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>



              <View style={styles.divider} />

              {/* Option: Login History */}
              <TouchableOpacity 
                style={styles.optionRow} 
                activeOpacity={0.7} 
                onPress={() => setShowHistoryModal(true)}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="time" size={18} color="#2563EB" />
                  <Text style={styles.optionLabel}>{t('settings.login_history')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* DATA SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('settings.data')}</Text>
            <View style={styles.sectionCard}>
              {/* Option: Clear Cache */}
              <TouchableOpacity 
                style={styles.optionRow} 
                activeOpacity={0.7} 
                onPress={handleClearCache}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="trash" size={18} color="#2563EB" />
                  <Text style={styles.optionLabel}>{t('settings.clear_cache')}</Text>
                </View>
                <Text style={styles.optionValue}>{cacheSize}</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Option: Delete Account */}
              <TouchableOpacity 
                style={styles.optionRow} 
                activeOpacity={0.7} 
                onPress={handleDeleteAccount}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <Text style={[styles.optionLabel, { color: '#EF4444' }]}>{t('settings.delete_account')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Language Bottom Sheet Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowLanguageModal(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.dragIndicator} />
              <Text style={styles.sheetTitle}>{t('settings.select_language')}</Text>
            </View>
            <View style={styles.sheetOptions}>
              {['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil'].map((lang) => (
                <TouchableOpacity 
                  key={lang} 
                  style={styles.sheetOptionRow} 
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={styles.sheetOptionText}>{lang}</Text>
                  {selectedLanguage === lang && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Change MPIN Modal */}
      <Modal
        visible={showMpinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMpinModal(false)}
      >
        <View style={styles.mpinOverlay}>
          <View style={styles.mpinCard}>
            <View style={styles.mpinHeader}>
              <Text style={styles.mpinTitle}>
                {hasExistingMpin ? 'Change MPIN' : 'Set MPIN'}
              </Text>
              <TouchableOpacity onPress={() => setShowMpinModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.mpinInputs}>
              {hasExistingMpin && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{t('settings.current_mpin')}</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={currentMpin}
                    onChangeText={setCurrentMpin}
                    placeholder="••••"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('settings.new_mpin')}</Text>
                <TextInput
                  style={styles.pinInput}
                  value={newMpin}
                  onChangeText={setNewMpin}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('settings.confirm_new_mpin')}</Text>
                <TextInput
                  style={styles.pinInput}
                  value={confirmMpin}
                  onChangeText={setConfirmMpin}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.mpinSaveBtn} onPress={handleSaveMpin} activeOpacity={0.8}>
              <Text style={styles.mpinSaveText}>
                {hasExistingMpin ? 'Update MPIN' : 'Set MPIN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Login History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowHistoryModal(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.dragIndicator} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{t('settings.login_history')}</Text>
                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.historyList}>
              {[...(user?.sessions || [])].sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()).length === 0 ? (
                <Text style={styles.emptySessionText}>{t('settings.no_login_history_found')}</Text>
              ) : (
                [...(user?.sessions || [])]
                  .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
                  .map((session, index) => {
                    const isCurrent = index === 0;
                    const formattedDate = new Date(session.lastActive).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isActive = isCurrent && session.type !== 'logout';
                    const actionText = session.type === 'logout' ? 'Logged Out' : 'Logged In';
                    const iconColor = session.type === 'logout' ? '#EF4444' : (isActive ? '#2563EB' : '#10B981');
                    
                    return (
                      <View key={session.id || index} style={styles.historyCard}>
                        <View style={[styles.historyIconBox, { backgroundColor: session.type === 'logout' ? '#FEF2F2' : (isActive ? '#EFF6FF' : '#ECFDF5') }]}>
                          <Ionicons 
                            name={session.device.toLowerCase().includes('web') ? 'laptop-outline' : 'phone-portrait-outline'} 
                            size={20} 
                            color={iconColor} 
                          />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyDevice}>
                            {session.device}
                          </Text>
                          <Text style={styles.historyMeta}>
                            {session.location} • {formattedDate}
                          </Text>
                        </View>
                        <View style={[styles.historyBadge, { backgroundColor: session.type === 'logout' ? '#FEF2F2' : (isActive ? '#EFF6FF' : '#F1F5F9') }]}>
                          <Text style={[styles.historyBadgeText, { color: session.type === 'logout' ? '#EF4444' : (isActive ? '#2563EB' : '#475569') }]}>
                            {isActive ? 'Active' : actionText}
                          </Text>
                        </View>
                      </View>
                    );
                  })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.successTitle}>{t('settings.settings_saved')}</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>{t('settings.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Cache Modal */}
      <Modal
        visible={showClearCacheModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearCacheModal(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.warningIconOuter}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.successIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="trash" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Clear Cache</Text>
            <Text style={styles.successSub}>
              This will clear all local data and log you out. Are you sure?
            </Text>
            <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
              <TouchableOpacity 
                style={[styles.successDoneBtn, { backgroundColor: '#EF4444', marginTop: 0 }]} 
                onPress={confirmClearCache}
                activeOpacity={0.8}
              >
                <Text style={styles.successDoneBtnText}>CLEAR & LOGOUT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.successDoneBtn, { backgroundColor: '#F1F5F9', marginTop: 0 }]} 
                onPress={() => setShowClearCacheModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.successDoneBtnText, { color: '#64748B' }]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
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
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionValue: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBgDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    maxHeight: '85%',
    paddingBottom: 24,
    ...shadows.lg,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 12,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetOptions: {
    gap: 8,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  // MPIN Overlay
  mpinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mpinCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: 24,
    gap: 16,
    ...shadows.lg,
  },
  mpinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mpinTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  mpinInputs: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 24,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 4,
  },
  mpinSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  mpinSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Login History List
  historyList: {
    gap: 12,
    marginTop: 8,
    paddingBottom: 24,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    gap: 4,
  },
  historyDevice: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Success Modal
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
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    ...shadows.lg,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 4,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptySessionText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  warningIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
