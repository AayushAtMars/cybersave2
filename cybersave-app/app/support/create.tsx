import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { createTicket } from '../../src/api/support';
import { useUploadDocument, getDownloadUrl } from '../../src/api/documents';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function CreateTicketScreen() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories = [
    'Technical Support',
    'Billing & Payments',
    'Account Security',
    'General Inquiry',
  ];

  const uploadDoc = useUploadDocument();

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const file = res.assets[0];

      // File size validation (limit 5MB as shown in mockup hint)
      const sizeMb = (file.size || 0) / (1024 * 1024);
      if (sizeMb > 5) {
        Alert.alert('File Too Large', 'Maximum file size permitted is 5 MB.');
        return;
      }

      setUploading(true);
      try {
        // Upload via Supabase pipeline
        const uploadedDoc = await uploadDoc.mutateAsync({
          file,
          documentCategory: 'Support Attachment',
        });

        // Fetch public download URL
        const downloadUrl = await getDownloadUrl(uploadedDoc.id);
        setAttachmentName(file.name);
        setAttachmentUrl(downloadUrl);
        Alert.alert('Upload Successful', 'Screenshot attached successfully!');
      } catch (err) {
        Alert.alert('Upload Failed', 'Failed to upload screenshot to server.');
      } finally {
        setUploading(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick screenshot.');
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject and detailed description.');
      return;
    }

    setLoading(true);
    try {
      await createTicket(subject, description, category, priority, attachmentUrl);
      Alert.alert('Ticket Created', 'Your support ticket has been raised successfully!', [
        { text: 'OK', onPress: () => router.replace('/support/tickets') }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to raise support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Raise a Ticket</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Form Container */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Category Selector */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Support Category</Text>
          <TouchableOpacity 
            style={styles.dropdownInput} 
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Ticket Subject */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ticket Subject</Text>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter subject of your issue"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Detailed Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Detailed Description</Text>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Explain your issue in detail..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Priority Level Selectors */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Priority Level</Text>
          <View style={styles.radioRow}>
            {(['low', 'medium', 'high'] as const).map((level) => {
              const isSelected = priority === level;
              return (
                <TouchableOpacity 
                  key={level} 
                  style={[styles.radioItem, isSelected && styles.radioItemSelected]}
                  onPress={() => setPriority(level)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'} 
                    size={16} 
                    color={isSelected ? '#2563EB' : '#94A3B8'} 
                  />
                  <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Upload Screenshots */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Upload Screenshots</Text>
          <TouchableOpacity 
            style={styles.uploadCard} 
            onPress={handlePickDocument}
            activeOpacity={0.7}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#2563EB" size="small" />
            ) : attachmentName ? (
              <View style={styles.attachmentSuccessRow}>
                <Ionicons name="document-attach-outline" size={24} color="#10B981" />
                <Text style={styles.attachmentNameText} numberOfLines={1}>{attachmentName}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={26} color="#2563EB" />
                <Text style={styles.uploadCardTitle}>Choose files or drag here</Text>
                <Text style={styles.uploadCardSub}>PNG, JPG, PDF up to 5MB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={loading || uploading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
          )}
        </TouchableOpacity>

        {/* FAQ Tip Banner */}
        <View style={styles.faqBanner}>
          <Ionicons name="information-circle" size={18} color="#2563EB" />
          <Text style={styles.faqBannerText}>
            Check FAQ before raising. Most issues resolve instantly!
          </Text>
        </View>
      </ScrollView>

      {/* Support Category bottom sheet */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowCategoryPicker(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.dragIndicator} />
              <Text style={styles.sheetTitle}>Select Category</Text>
            </View>
            <View style={styles.sheetOptions}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={styles.sheetOptionRow} 
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{cat}</Text>
                  {category === cat && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}
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
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...shadows.sm,
  },
  dropdownText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    ...shadows.sm,
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    fontSize: 14,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
    ...shadows.sm,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  radioItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingVertical: 12,
    ...shadows.sm,
  },
  radioItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  radioLabelSelected: {
    color: '#2563EB',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadows.sm,
  },
  uploadCardTitle: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
  },
  uploadCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  attachmentSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  attachmentNameText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  faqBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  faqBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    lineHeight: 16,
  },

  // Dropdown bottom sheet modal
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  sheetHeader: {
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetOptions: {
    gap: spacing.sm,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
