import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments, useUploadDocument, useDeleteDocument, getDownloadUrl } from '../../src/api/documents';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'id_proof', label: 'IDs' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'income_proof', label: 'Financial' },
];

export default function MyDocumentsScreen() {
    const { t } = useTranslation();
  const { data: documents, isLoading } = useDocuments();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Calculate current storage usage
  const totalSizeBytes = documents?.reduce((sum, doc) => sum + (doc.sizeBytes || 0), 0) ?? 0;
  const totalMb = totalSizeBytes / (1024 * 1024);
  const LIMIT_MB = 50; // Requested limit
  const progressPct = Math.min((totalMb / LIMIT_MB) * 100, 100);

  const handleDownload = async (docId: string) => {
    try {
      const url = await getDownloadUrl(docId);
      if (url) {
        Linking.openURL(url);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to retrieve file download URL.');
    }
  };

  const handleShare = async (docId: string, name: string) => {
    try {
      const url = await getDownloadUrl(docId);
      if (url) {
        await Share.share({
          message: `Securely access document "${name}" here: ${url}`,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to share document.');
    }
  };

  const handleDelete = (docId: string, name: string) => {
    setDocumentToDelete({ id: docId, name });
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    setShowDeleteConfirmModal(false);
    // Allow animation delay
    setTimeout(async () => {
      try {
        await deleteDocument.mutateAsync(documentToDelete.id);
        setShowDeleteSuccessModal(true);
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.error ?? 'Failed to delete document.');
      } finally {
        setDocumentToDelete(null);
      }
    }, 300);
  };

  const handleUpload = () => {
    setShowCategoryModal(true);
  };

  const triggerFilePicker = async (category: string) => {
    setShowCategoryModal(false);
    // Allow a small delay for modal close transition
    setTimeout(async () => {
      try {
        const pickerResult = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          copyToCacheDirectory: true,
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
          const file = pickerResult.assets[0];

          // Enforce 50 MB limit checks client-side too
          const fileSizeMb = (file.size || 0) / (1024 * 1024);
          if (totalMb + fileSizeMb > LIMIT_MB) {
            Alert.alert('Storage Limit Exceeded', `Cannot upload this file. Enforced limit is ${LIMIT_MB} MB.`);
            return;
          }

          // Start progress tracking loader
          setIsUploading(true);
          setUploadProgress(0);
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + 5;
            });
          }, 150);

          try {
            await uploadDocument.mutateAsync({
              file,
              documentCategory: category,
            });
            clearInterval(progressInterval);
            setUploadProgress(100);
            setTimeout(() => {
              setIsUploading(false);
              setShowSuccessModal(true);
            }, 300);
          } catch (uploadErr) {
            clearInterval(progressInterval);
            setIsUploading(false);
            throw uploadErr;
          }
        }
      } catch (err: any) {
        Alert.alert('Upload Failed', err?.response?.data?.error || err?.message || 'Failed to complete upload.');
      }
    }, 400);
  };

  // Filter list items based on selection
  const filteredDocs = documents?.filter((doc) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'id_proof') return doc.documentCategory === 'id_proof';
    if (selectedCategory === 'certificate') {
      return doc.documentCategory === 'birth_proof' || doc.documentCategory === 'address_proof' || doc.documentCategory === 'other';
    }
    if (selectedCategory === 'income_proof') return doc.documentCategory === 'income_proof';
    return true;
  });

  const getFriendlyCategoryLabel = (category: string) => {
    switch (category) {
      case 'id_proof': return 'ID Proof';
      case 'birth_proof': return 'Certificate';
      case 'address_proof': return 'Certificate';
      case 'income_proof': return 'Financial';
      default: return 'Document';
    }
  };

  const getFriendlyDate = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={24} color="#2563EB" />
        </View>
        <View style={styles.info}>
          <Text style={styles.docName} numberOfLines={1}>{item.originalName}</Text>
          <Text style={styles.docMeta}>
            
                                  {t('documents.uploaded')} {getFriendlyDate(item.createdAt)} • {((item.sizeBytes || 0) / (1024 * 1024)).toFixed(1)}  {t('documents.mb')}
                                </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{getFriendlyCategoryLabel(item.documentCategory)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(item.id || item._id)}>
          <Ionicons name="eye-outline" size={16} color="#64748B" />
          <Text style={styles.actionText}>{t('documents.view')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(item.id || item._id)}>
          <Ionicons name="download-outline" size={16} color="#64748B" />
          <Text style={styles.actionText}>{t('documents.download')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item.id || item._id, item.originalName)}>
          <Ionicons name="share-social-outline" size={16} color="#64748B" />
          <Text style={styles.actionText}>{t('documents.share')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id || item._id, item.originalName)}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>{t('documents.my_documents')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Body */}
      <View style={styles.whiteContainer}>
        <View style={styles.cardContainer}>
          {/* Storage Bar Card */}
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Text style={styles.storageTitle}>{t('documents.storage_usage')}</Text>
              <Text style={styles.storageLimitText}>{totalMb.toFixed(1)}  {t('documents.mb')} {LIMIT_MB}  {t('documents.mb')}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
            </View>
          </View>

          {/* Chips row */}
          <View style={styles.chipsContainer}>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chipsList}
              renderItem={({ item }) => {
                const active = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedCategory(item.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Upload Button */}
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} activeOpacity={0.8}>
            <Ionicons name="add" size={18} color="#2563EB" />
            <Text style={styles.uploadBtnText}>{t('documents.upload_new_document')}</Text>
          </TouchableOpacity>

          {/* Document List */}
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" size="large" />
          ) : filteredDocs?.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>{t('documents.vault_is_empty')}</Text>
              <Text style={styles.emptySub}>
                
                                                  {t('documents.uploaded_documents_will_show_u')}
                                                </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDocs}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* Premium Category Picker Modal (Bottom Sheet style) */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowCategoryModal(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{t('documents.select_document_type')}</Text>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetSubtitle}>{t('documents.choose_the_category_of_the_doc')}</Text>
            </View>

            <View style={styles.sheetOptions}>
              {/* Option 1: ID Proof */}
              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={() => triggerFilePicker('id_proof')}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="card-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{t('documents.id_proof')}</Text>
                  <Text style={styles.optionDesc}>{t('documents.aadhaar_card_pan_card_voter_id')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 2: Certificate */}
              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={() => triggerFilePicker('birth_proof')}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="ribbon-outline" size={22} color="#10B981" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{t('documents.certificate_birth_proof')}</Text>
                  <Text style={styles.optionDesc}>{t('documents.birth_certificate_address_cert')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 3: Financial */}
              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={() => triggerFilePicker('income_proof')}
              >
                <View style={[styles.optionIconBox, { backgroundColor: '#FDF4FF' }]}>
                  <Ionicons name="cash-outline" size={22} color="#D946EF" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{t('documents.financial_income_proof')}</Text>
                  <Text style={styles.optionDesc}>{t('documents.itr_receipts_payslips_bank_sta')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#FFFFFF' }} />
          </View>
        </View>
      </Modal>

      {/* Uploading Progress Modal */}
      <Modal
        visible={isUploading}
        transparent
        animationType="fade"
      >
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <Ionicons name="cloud-upload-outline" size={40} color="#2563EB" style={styles.loaderIcon} />
            <Text style={styles.loaderTitle}>{t('documents.uploading_document')}</Text>
            <Text style={styles.loaderPercent}>{uploadProgress}%</Text>
            <View style={styles.loaderProgressTrack}>
              <View style={[styles.loaderProgressBar, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.loaderSub}>{t('documents.please_wait_while_we_encrypt_a')}</Text>
          </View>
        </View>
      </Modal>

      {/* Premium Success Modal */}
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
            <Text style={styles.successTitle}>{t('documents.upload_successful')}</Text>
            <Text style={styles.successSub}>
              
                                        {t('documents.your_document_has_been_safely_')}
                                      </Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>{t('documents.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Delete Success Modal */}
      <Modal
        visible={showDeleteSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccessModal(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.deleteIconOuter}>
              <View style={styles.deleteIconInner}>
                <Ionicons name="trash-outline" size={32} color="#EF4444" />
              </View>
            </View>
            <Text style={styles.deleteTitle}>{t('documents.document_deleted')}</Text>
            <Text style={styles.deleteSub}>
              
                                        {t('documents.the_file_has_been_permanently_')}
                                      </Text>
            <TouchableOpacity 
              style={styles.deleteDoneBtn} 
              onPress={() => setShowDeleteSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteDoneBtnText}>{t('documents.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.warningIconOuter}>
              <View style={styles.warningIconInner}>
                <Ionicons name="alert-circle-outline" size={36} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.successTitle}>{t('documents.delete_document')}</Text>
            <Text style={styles.successSub}>
              
                                        {t('documents.are_you_sure_you_want_to_perma')}{documentToDelete?.name}{t('documents.this_action_cannot_be_undone')}
                                      </Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowDeleteConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>{t('documents.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmDeleteBtn} 
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmDeleteBtnText}>{t('documents.delete')}</Text>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    flex: 1,
  },
  storageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  storageLimitText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  chipsContainer: {
    marginBottom: 0,
  },
  chipsList: {
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
  },
  uploadBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontFamily: 'Manrope',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  docMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  categoryBadge: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: 'auto',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  // Modal styling (Bottom Sheet)
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
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  sheetOptions: {
    gap: 8,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
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

  // Loader Modal styling
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loaderCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...shadows.lg,
  },
  loaderIcon: {
    marginBottom: 4,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  loaderPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    marginVertical: 4,
  },
  loaderProgressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loaderProgressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: radius.full,
  },
  loaderSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
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

  // Delete Success Modal styling
  deleteIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  deleteDoneBtn: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Warning (Delete confirmation) Modal styling
  warningIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  warningIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  modalConfirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmDeleteBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
