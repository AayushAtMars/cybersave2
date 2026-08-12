import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useService, useSaveWizardStep } from '../../src/api/applications';
import { useUploadDocument } from '../../src/api/documents';
import { colors, spacing, radius, shadows } from '../../src/theme';

interface UploadedFile {
  id?: string;
  name: string;
  sizeBytes: number;
  uploading?: boolean;
  error?: string;
}

export default function Step3DocumentsScreen() {
  const draft = useDraftStore((s) => s.draft);
  const updateDraft = useDraftStore((s) => s.updateDraft);
  const { data: service, isLoading } = useService(draft?.serviceId ?? '');
  const saveStep = useSaveWizardStep(draft?.id ?? '');
  const uploadDoc = useUploadDocument();

  const [files, setFiles] = useState<Record<string, UploadedFile>>({});
  const [docIds, setDocIds] = useState<Record<string, string>>({}); // docKey → documentId
  // Keep a reference to the raw picked asset for retry on error
  const [pickedAssets, setPickedAssets] = useState<Record<string, any>>({}); // docKey → DocumentPickerAsset

  const setFileState = (key: string, partial: Partial<UploadedFile>) =>
    setFiles((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } as UploadedFile }));

  // Upload a single picked asset and update state
  const uploadAsset = async (docKey: string, asset: any) => {
    setFileState(docKey, { uploading: true, error: undefined });
    try {
      const result = await uploadDoc.mutateAsync({
        file: asset,
        documentCategory: 'proof',
        applicationId: draft?.id,
      });
      setFileState(docKey, { id: result.id, uploading: false });
      setDocIds((prev) => ({ ...prev, [docKey]: result.id }));
      return result.id as string;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Upload failed. Tap retry.';
      setFileState(docKey, { uploading: false, error: msg });
      return null;
    }
  };

  const handlePick = async (docKey: string) => {
    try {
      const docRes = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (docRes.canceled || !docRes.assets || docRes.assets.length === 0) return;
      const asset = docRes.assets[0];

      // Store asset locally for retry and show picked state immediately
      setPickedAssets((prev) => ({ ...prev, [docKey]: asset }));
      setFileState(docKey, {
        name: asset.name ?? 'upload',
        sizeBytes: asset.size ?? 0,
        uploading: true,
        error: undefined,
      });

      await uploadAsset(docKey, asset);
    } catch (err: any) {
      setFileState(docKey, { uploading: false, error: 'Could not open document picker.' });
    }
  };

  const handleRetry = async (docKey: string) => {
    const asset = pickedAssets[docKey];
    if (!asset) return;
    await uploadAsset(docKey, asset);
  };

  const handleRemove = (docKey: string) => {
    setFiles((prev) => { const n = { ...prev }; delete n[docKey]; return n; });
    setDocIds((prev) => { const n = { ...prev }; delete n[docKey]; return n; });
    setPickedAssets((prev) => { const n = { ...prev }; delete n[docKey]; return n; });
  };

  if (isLoading || !service) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  const requiredDocs = service.requiredDocuments || [];

  // ✅ Enable Continue when all mandatory docs are PICKED (not just server-confirmed)
  // This handles cases where backend upload succeeds or fails — user shouldn't be blocked
  const mandatoryDocs = requiredDocs.filter((d) => d.mandatory);
  const allMandatoryPicked = mandatoryDocs.every(
    (d) => !!files[d.name] && !files[d.name].uploading
  );
  // Track if any are still uploading
  const anyUploading = Object.values(files).some((f) => f.uploading);
  // Track if there are unpersisted files (picked but not confirmed by server)
  const pendingFiles = requiredDocs.filter(
    (d) => files[d.name] && !docIds[d.name] && !files[d.name].uploading
  );

  const handleNext = async () => {
    // Attempt to upload any files that are picked but not yet confirmed by backend
    const uploadPromises = pendingFiles.map((d) => {
      const asset = pickedAssets[d.name];
      return asset ? uploadAsset(d.name, asset) : Promise.resolve(null);
    });
    const results = await Promise.all(uploadPromises);

    // Collect all confirmed IDs (from docIds state + just-uploaded)
    const confirmedIds = { ...docIds };
    pendingFiles.forEach((d, i) => {
      if (results[i]) confirmedIds[d.name] = results[i] as string;
    });

    const ids = Object.values(confirmedIds).filter(Boolean);

    // Proceed even if upload failed — backend will validate later
    // Saves whichever IDs we have
    try {
      await saveStep.mutateAsync({ step: 3, data: { documentIds: ids } });
      updateDraft({ documentIds: ids, currentStep: 4 });
      router.push('/(application)/step-4-review');
    } catch (err) {
      // If saveStep fails, still navigate forward (offline-first)
      updateDraft({ documentIds: ids, currentStep: 4 });
      router.push('/(application)/step-4-review');
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
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Upload Proofs</Text>
          <Text style={styles.headerStep}>Step 2/5</Text>
        </View>
        {/* Progress track */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '40%' }]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Floating Container */}
        <View style={styles.whiteContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Required Documents</Text>

            <View style={styles.tilesList}>
              {requiredDocs.map((doc, idx) => {
                const file = files[doc.name];
                const isConfirmed = !!docIds[doc.name];
                const isUploading = !!file?.uploading;
                const hasError = !!file?.error;
                const isPicked = !!file && !isUploading;

                return (
                  <View key={idx} style={styles.docField}>
                    <View style={styles.docLabelRow}>
                      <Text style={styles.docLabel}>
                        {doc.name}
                        {doc.mandatory && <Text style={styles.req}> *</Text>}
                      </Text>
                      {(isConfirmed || isPicked) && (
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                      )}
                    </View>

                    {file ? (
                      <View>
                        <View style={[
                          styles.uploadedTile,
                          hasError && styles.uploadedTileError,
                        ]}>
                          <Ionicons
                            name="document-text"
                            size={20}
                            color="#2563EB"
                          />
                          <Text style={styles.fileName} numberOfLines={1}>
                            {file.name}
                          </Text>
                          {isUploading ? (
                            <ActivityIndicator color="#2563EB" size="small" />
                          ) : (
                            <TouchableOpacity onPress={() => handleRemove(doc.name)}>
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                        {/* Retry row for errored uploads */}
                        {hasError && (
                          <View style={styles.errorRow}>
                            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                            <Text style={styles.errorText}>{file.error}</Text>
                            <TouchableOpacity onPress={() => handleRetry(doc.name)} style={styles.retryBtn}>
                              <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {/* Pending upload note */}
                        {isPicked && !isConfirmed && !hasError && (
                          <Text style={styles.pendingNote}>✓ Selected — will upload on Continue</Text>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadCard}
                        onPress={() => handlePick(doc.name)}
                      >
                        <Ionicons name="cloud-upload-outline" size={18} color="#64748B" />
                        <Text style={styles.uploadText}>{doc.description || 'PDF, JPEG (Max 2MB)'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                (!allMandatoryPicked || anyUploading) && styles.continueBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={!allMandatoryPicked || anyUploading || saveStep.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>
                {anyUploading ? 'Uploading...' : saveStep.isPending ? 'Saving...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    paddingBottom: 24,
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
    paddingTop: spacing.xs,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerStep: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  tilesList: { gap: 16 },
  docField: { gap: 8 },
  docLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  req: { color: '#EF4444' },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    gap: 4,
  },
  uploadText: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#64748B',
  },
  uploadedTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 14,
    color: '#0F172A',
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  uploadedTileConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  uploadedTileError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pendingNote: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
