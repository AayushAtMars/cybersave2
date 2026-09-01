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
import { useTranslation } from "react-i18next";

export default function CreateTicketScreen() {
    const { t } = useTranslation();
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
          documentCategory: 'other',
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
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('create.raise_a_ticket')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Form Container */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.whiteCardContainer}>
          {/* Support Category Selector */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('create.support_category')}</Text>
            <TouchableOpacity 
              style={styles.dropdownInput} 
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownText}>{category}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Ticket Subject */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('create.ticket_subject')}</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter subject of your issue"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Detailed Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('create.detailed_description')}</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Explain your issue in detail..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Priority Level Selectors */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('create.priority_level')}</Text>
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
                    <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
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
            <Text style={styles.fieldLabel}>{t('create.upload_screenshots')}</Text>
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
                  <Ionicons name="cloud-upload-outline" size={24} color="#2563EB" />
                  <Text style={styles.uploadCardTitle}>{t('create.choose_files_or_drag_here')}</Text>
                  <Text style={styles.uploadCardSub}>{t('create.png_jpg_pdf_up_to_5mb')}</Text>
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
              <Text style={styles.submitBtnText}>{t('create.submit_support_ticket')}</Text>
            )}
          </TouchableOpacity>

          {/* FAQ Tip Banner */}
          <View style={styles.faqBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.faqBannerText}>
              
                                        {t('create.check_faq_before_raising_most_')}
                                      </Text>
          </View>
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
              <Text style={styles.sheetTitle}>{t('create.select_category')}</Text>
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
    marginHorizontal: 24,
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
  field: {
    gap: 6,
    alignSelf: 'stretch',
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 41,
  },
  dropdownText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '400',
    lineHeight: 17,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 41,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Inter',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignSelf: 'stretch',
  },
  radioItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 36,
  },
  radioItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  radioDotSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#E2E8F0',
  },
  radioLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 16,
  },
  radioLabelSelected: {
    color: '#2563EB',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 109,
    alignSelf: 'stretch',
  },
  uploadCardTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    lineHeight: 16,
  },
  uploadCardSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 13,
  },
  attachmentSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  attachmentNameText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    alignSelf: 'stretch',
  },
  submitBtnText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  faqBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    height: 54,
    alignSelf: 'stretch',
  },
  faqBannerText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    lineHeight: 15,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 12,
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
});
