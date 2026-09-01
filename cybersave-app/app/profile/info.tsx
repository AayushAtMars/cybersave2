import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useUpdateProfile } from '../../src/api/auth';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

export default function PersonalInfoScreen() {
    const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [dob, setDob] = useState(user?.dob ?? '15 August 1988');
  const [gender, setGender] = useState<string>(user?.gender ?? 'Male');

  // Linking document state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingType, setLinkingType] = useState<'aadhaar' | 'pan' | null>(null);
  const [docNumber, setDocNumber] = useState('');

  const initials = (user?.name || 'Rajesh Kumar')
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'RK';

  const formattedPhone = user?.phone 
    ? (user.phone.startsWith('+') ? user.phone : `+91 ${user.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`)
    : '+91 98765 43210';

  const handleSave = async () => {
    const trimmedEmail = email.trim();

    // Email is the only field the user can freely edit on this screen.
    // DOB and Gender are display-only — they cannot be changed here.
    if (!trimmedEmail) {
      Alert.alert('No Changes', 'Please enter an email address to save.');
      return;
    }

    // If email hasn't changed, nothing to do
    if (trimmedEmail === (user?.email ?? '')) {
      Alert.alert('No Changes', 'The email address is the same as the current one.');
      return;
    }

    try {
      await updateProfile.mutateAsync({ email: trimmedEmail });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Failed to update profile';
      Alert.alert('Error', msg);
    }
  };

  const handleChangePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need storage permissions to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfile.mutateAsync({ avatar: base64Image });
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to update profile photo.');
    }
  };

  const handleOpenLinkModal = (type: 'aadhaar' | 'pan') => {
    setLinkingType(type);
    setDocNumber('');
    setShowLinkModal(true);
  };

  const handleLinkSubmit = async () => {
    if (linkingType === 'aadhaar') {
      if (docNumber.replace(/\s/g, '').length !== 12) {
        Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
        return;
      }
      try {
        await updateProfile.mutateAsync({ aadhaarNumber: docNumber });
        Alert.alert('Success', 'Aadhaar linked successfully.');
        setShowLinkModal(false);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error ?? 'Failed to link Aadhaar.');
      }
    } else if (linkingType === 'pan') {
      if (docNumber.trim().length !== 10) {
        Alert.alert('Invalid PAN', 'Please enter a valid 10-character PAN number.');
        return;
      }
      try {
        await updateProfile.mutateAsync({ panNumber: docNumber });
        Alert.alert('Success', 'PAN linked successfully.');
        setShowLinkModal(false);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error ?? 'Failed to link PAN.');
      }
    }
  };

  const hasAadhaar = !!((user as any)?.aadhaarMasked || (user as any)?.aadhaarNumber);
  const aadhaarValue = hasAadhaar 
    ? ((user as any)?.aadhaarMasked || (user as any)?.aadhaarNumber) 
    : 'Not Linked';

  const hasPan = !!((user as any)?.panMasked);
  const panValue = hasPan 
    ? ((user as any)?.panMasked) 
    : 'Not Linked';

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
          <Text style={styles.headerTitle}>{t('info.personal_information')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Body container */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.whiteContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto}>
                <Text style={styles.changePhotoText}>{t('info.change_photo')}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.field}>
                <Text style={styles.label}>{t('info.full_name')}</Text>
                <TextInput 
                  style={[styles.input, styles.disabledInput]} 
                  value={name} 
                  onChangeText={setName}
                  editable={false} 
                />
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('info.phone')}</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>{t('info.verified')}</Text>
                  </View>
                </View>
                <TextInput 
                  style={[styles.input, styles.disabledInput]} 
                  value={formattedPhone} 
                  editable={false} 
                />
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>{t('info.email')}</Text>
                <TextInput 
                  style={styles.input} 
                  value={email} 
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Date of Birth */}
              <View style={styles.field}>
                <Text style={styles.label}>{t('info.date_of_birth')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    value={dob} 
                    onChangeText={setDob}
                    placeholder="e.g. 15 August 1988"
                    placeholderTextColor="#94A3B8"
                  />
                  <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.inputIcon} />
                </View>
              </View>

              {/* Gender */}
              <View style={styles.field}>
                <Text style={styles.label}>{t('info.gender')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    value={gender} 
                    onChangeText={setGender}
                    placeholder="Select gender"
                    placeholderTextColor="#94A3B8"
                  />
                  <Ionicons name="chevron-down-outline" size={16} color="#64748B" style={styles.inputIcon} />
                </View>
              </View>

              {/* Aadhaar (Masked) */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('info.aadhaar_masked')}</Text>
                  <TouchableOpacity 
                    onPress={() => !hasAadhaar && handleOpenLinkModal('aadhaar')}
                    activeOpacity={hasAadhaar ? 1 : 0.7}
                  >
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>
                        {hasAadhaar ? 'Linked' : 'Link now'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  onPress={() => !hasAadhaar && handleOpenLinkModal('aadhaar')} 
                  disabled={hasAadhaar}
                  activeOpacity={0.7}
                >
                  <TextInput 
                    style={[styles.input, styles.disabledInput, !hasAadhaar && styles.notLinkedInput]} 
                    value={aadhaarValue} 
                    editable={false} 
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>

              {/* PAN (Masked) */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('info.pan_masked')}</Text>
                  <TouchableOpacity 
                    onPress={() => !hasPan && handleOpenLinkModal('pan')}
                    activeOpacity={hasPan ? 1 : 0.7}
                  >
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>
                        {hasPan ? 'Linked' : 'Link now'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  onPress={() => !hasPan && handleOpenLinkModal('pan')} 
                  disabled={hasPan}
                  activeOpacity={0.7}
                >
                  <TextInput 
                    style={[styles.input, styles.disabledInput, !hasPan && styles.notLinkedInput]} 
                    value={panValue} 
                    editable={false} 
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>{t('info.save_changes')}</Text>
            </TouchableOpacity>

            <Text style={styles.timestamp}>{t('info.last_updated_12_may_2026_4_32_')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Link Document Modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                
                                              {t('info.link')} {linkingType === 'aadhaar' ? 'Aadhaar' : 'PAN'}  {t('info.card')}
                                            </Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              
                                        {t('info.enter_your_12_digit_aadhaar_nu')}
                                      </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={linkingType === 'aadhaar' ? '12-digit Aadhaar Number' : '10-character PAN Number'}
              placeholderTextColor="#94A3B8"
              keyboardType={linkingType === 'aadhaar' ? 'numeric' : 'default'}
              maxLength={linkingType === 'aadhaar' ? 12 : 10}
              autoCapitalize="characters"
              value={docNumber}
              onChangeText={setDocNumber}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={handleLinkSubmit}>
                <Text style={styles.modalApplyBtnText}>{t('info.link_document')}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Manrope',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoBtn: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  changePhotoText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  disabledInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  notLinkedInput: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    fontWeight: '400',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  modalActions: {
    marginTop: 8,
  },
  modalApplyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
