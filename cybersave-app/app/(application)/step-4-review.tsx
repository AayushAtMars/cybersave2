import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useService, useSaveWizardStep } from '../../src/api/applications';
import { useDocuments } from '../../src/api/documents';
import { colors, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

export default function Step4ReviewScreen() {
    const { t } = useTranslation();
  const draft = useDraftStore((s) => s.draft);
  const updateDraft = useDraftStore((s) => s.updateDraft);
  const { data: service, isLoading } = useService(draft?.serviceId ?? '');
  const { data: userDocs } = useDocuments();
  const saveStep = useSaveWizardStep(draft?.id ?? '');

  if (isLoading || !service) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  const formData = (draft?.formData ?? {}) as Record<string, string>;
  const address = (draft?.applicantAddress ?? {}) as Record<string, string>;

  // Group fields into Personal and Address details dynamically to match Step 1 grouping
  const fields = service.formFields || [];
  
  const personalFields = fields.filter(
    (f) => !['pincode', 'state', 'district', 'city', 'address', 'addressline1', 'addressline2'].includes(f.key.toLowerCase())
  );
  const addressFields = fields.filter(
    (f) => ['pincode', 'state', 'district', 'city', 'address', 'addressline1', 'addressline2'].includes(f.key.toLowerCase())
  );

  const displayPersonal = personalFields.length > 0 ? personalFields : [
    { key: 'fullName', label: 'Full Name' },
    { key: 'dob', label: 'DOB' },
    { key: 'gender', label: 'Gender' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'motherName', label: "Mother's Name" },
    { key: 'placeOfBirth', label: 'Place of Birth' },
  ];

  const displayAddress = addressFields.length > 0 ? addressFields : [
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'pincode', label: 'PIN Code' },
  ];

  const getFieldValue = (key: string) => {
    // 1. Check draft.formData (which holds the dynamic form values)
    if (formData && formData[key] !== undefined && formData[key] !== '') {
      return String(formData[key]);
    }
    // 2. Check standard fields
    if (key === 'fullName' || key === 'applicantName') {
      return draft?.applicantName || '';
    }
    if (key === 'dob' || key === 'applicantDob') {
      return draft?.applicantDob || '';
    }
    if (key === 'gender' || key === 'applicantGender') {
      return draft?.applicantGender || '';
    }
    if (key === 'fatherName') {
      return formData.fatherName || '';
    }
    if (key === 'motherName') {
      return formData.motherName || '';
    }
    if (key === 'placeOfBirth' || key === 'birthPlace') {
      return formData.placeOfBirth || formData.birthPlace || '';
    }
    // 3. Check address details
    if (address) {
      if (key === 'state') return address.state || '';
      if (key === 'district' || key === 'city') return address.city || address.district || '';
      if (key === 'pincode' || key === 'pinCode') return address.pincode || '';
    }
    return '';
  };

  // Values in Rupees
  const govtFeeRupees = (draft?.govtFee ?? service.govtFee) / 100;
  const convenienceFeeRupees = (draft?.convenienceFee ?? service.convenienceFee) / 100;
  const totalPayableRupees = govtFeeRupees + convenienceFeeRupees;

  const handleNext = async () => {
    try {
      await saveStep.mutateAsync({ step: 4, data: {} });
      updateDraft({ reviewConfirmed: true, declarationAccepted: true, currentStep: 5 });
      router.push('/(application)/step-5-payment');
    } catch (err) {
      console.warn('Failed to save review:', err);
    }
  };

  const handleEdit = (step: number) => {
    if (step === 1) {
      router.push('/(application)/step-1-personal');
    } else if (step === 2) {
      router.push('/(application)/step-3-documents');
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
          <Text style={styles.headerTitle} numberOfLines={1}>{t('step-4-review.review_details')}</Text>
          <Text style={styles.headerStep}>{t('step-4-review.step_3_5')}</Text>
        </View>
        {/* Progress track */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '60%' }]} />
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
            <Text style={styles.sectionTitle}>{t('step-4-review.review_application')}</Text>

            {/* Personal Details Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('step-4-review.personal_details')}</Text>
                <TouchableOpacity onPress={() => handleEdit(1)}>
                  <Text style={styles.editText}>{t('step-4-review.edit')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dataGrid}>
                {displayPersonal.map((field) => {
                  const val = getFieldValue(field.key);
                  if (!val) return null; // Only show fields that have values filled
                  return (
                    <View key={field.key} style={styles.gridRow}>
                      <Text style={styles.gridLabel}>{field.label}</Text>
                      <Text style={styles.gridValue}>{val}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Address Details Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('step-4-review.address_details')}</Text>
                <TouchableOpacity onPress={() => handleEdit(1)}>
                  <Text style={styles.editText}>{t('step-4-review.edit')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dataGrid}>
                {displayAddress.map((field) => {
                  const val = getFieldValue(field.key);
                  if (!val) return null;
                  return (
                    <View key={field.key} style={styles.gridRow}>
                      <Text style={styles.gridLabel}>{field.label}</Text>
                      <Text style={styles.gridValue}>{val}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Uploaded Documents Card */}
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('step-4-review.uploaded_documents')}</Text>
                <TouchableOpacity onPress={() => handleEdit(2)}>
                  <Text style={styles.editText}>{t('step-4-review.edit')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dataGrid}>
                {draft?.documentIds && draft.documentIds.length > 0 && userDocs ? (
                  userDocs
                    .filter((d) => draft.documentIds?.includes(d.id || d._id || ''))
                    .map((doc, idx) => (
                      <View key={idx} style={styles.docRow}>
                        <Ionicons name="document-text" size={16} color="#2563EB" />
                        <Text style={styles.docNameText} numberOfLines={1}>
                          {doc.originalName}
                        </Text>
                      </View>
                    ))
                ) : (
                  service.requiredDocuments.map((doc, idx) => (
                    <View key={idx} style={styles.docRow}>
                      <Ionicons name="document-text" size={16} color="#2563EB" />
                      <Text style={styles.docNameText} numberOfLines={1}>
                        {doc.name.toLowerCase().replace(/\s+/g, '_')}{t('step-4-review.pdf')}
                                                    </Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Payment Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>{t('step-4-review.payment_summary')}</Text>
              <View style={[styles.dataGrid, { marginTop: 12 }]}>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>{t('step-4-review.government_fee')}</Text>
                  <Text style={styles.gridFeeValue}>₹{govtFeeRupees.toFixed(2)}</Text>
                </View>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>{t('step-4-review.convenience_fee')}</Text>
                  <Text style={styles.gridFeeValue}>₹{convenienceFeeRupees.toFixed(2)}</Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t('step-4-review.total_payable')}</Text>
                  <Text style={styles.totalValue}>₹{totalPayableRupees.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Action button inside scroll to avoid clipping on smaller screens */}
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleNext}
              disabled={saveStep.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>
                {saveStep.isPending ? 'Processing...' : 'Proceed to Payment'}
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
    gap: 16,
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
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
  },
  editText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 18,
  },
  dataGrid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gridLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  gridValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  gridFeeValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 17,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
  },
  totalValue: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 21,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 16,
  },
  docNameText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 16,
    flex: 1,
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
