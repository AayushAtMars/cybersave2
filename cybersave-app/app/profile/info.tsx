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

export default function PersonalInfoScreen() {
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
    try {
      await updateProfile.mutateAsync({
        dob: dob || undefined,
        gender: (gender.toLowerCase() as any) || undefined,
        email: email || undefined,
      });
      Alert.alert('Success', 'Profile details updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to update profile');
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
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Body container */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.whiteContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
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
                <Text style={styles.label}>Phone</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
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
              <Text style={styles.label}>Email</Text>
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
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  value={dob} 
                  onChangeText={setDob}
                  placeholder="e.g. 15 August 1988"
                  placeholderTextColor="#94A3B8"
                />
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input} 
                  value={gender} 
                  onChangeText={setGender}
                  placeholder="Select gender"
                  placeholderTextColor="#94A3B8"
                />
                <Ionicons name="chevron-down-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              </View>
            </View>

            {/* Aadhaar (Masked) */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Aadhaar (Masked)</Text>
                <TouchableOpacity 
                  onPress={() => !hasAadhaar && handleOpenLinkModal('aadhaar')}
                  activeOpacity={hasAadhaar ? 1 : 0.7}
                >
                  <View style={hasAadhaar ? styles.linkedBadge : styles.notLinkedBadge}>
                    <Text style={hasAadhaar ? styles.linkedText : styles.notLinkedText}>
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
                <Text style={styles.label}>PAN (Masked)</Text>
                <TouchableOpacity 
                  onPress={() => !hasPan && handleOpenLinkModal('pan')}
                  activeOpacity={hasPan ? 1 : 0.7}
                >
                  <View style={hasPan ? styles.linkedBadge : styles.notLinkedBadge}>
                    <Text style={hasPan ? styles.linkedText : styles.notLinkedText}>
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
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <Text style={styles.timestamp}>Last updated: 12 May 2026, 4:32 PM</Text>
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
                Link {linkingType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Card
              </Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Enter your 12-digit Aadhaar number or 10-character PAN card number to link it to your account.
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
                <Text style={styles.modalApplyBtnText}>Link Document</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoBtn: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  changePhotoText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#64748B',
  },
  inputIcon: {
    position: 'absolute',
    right: spacing.md,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  verifiedText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
  linkedBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  linkedText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  notLinkedBadge: {
    backgroundColor: '#FFE4E6',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  notLinkedText: {
    fontSize: 10,
    color: '#E11D48',
    fontWeight: '700',
  },
  notLinkedInput: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: spacing.xs,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
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
    borderRadius: radius.lg,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginTop: spacing.xs,
  },
  modalActions: {
    marginTop: spacing.sm,
  },
  modalApplyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
