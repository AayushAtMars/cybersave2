import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useService, useSaveWizardStep } from '../../src/api/applications';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function Step4ReviewScreen() {
  const draft = useDraftStore((s) => s.draft);
  const updateDraft = useDraftStore((s) => s.updateDraft);
  const { data: service, isLoading } = useService(draft?.serviceId ?? '');
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

  return (
    <View style={styles.flex}>
      {/* Header block with 60% progress indicator */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Details</Text>
          <Text style={styles.headerStep}>Step 3/5</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '60%' }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Full Name</Text>
              <Text style={styles.rowValue}>
                {draft?.applicantName || 'Rajesh Kumar'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>DOB</Text>
              <Text style={styles.rowValue}>
                {draft?.applicantDob || '12/04/1995'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gender</Text>
              <Text style={styles.rowValue}>
                {draft?.applicantGender || 'Male'}
              </Text>
            </View>
            {formData.fatherName && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Father's Name</Text>
                <Text style={styles.rowValue}>{formData.fatherName}</Text>
              </View>
            )}
            {formData.motherName && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Mother's Name</Text>
                <Text style={styles.rowValue}>{formData.motherName}</Text>
              </View>
            )}
            {formData.birthPlace && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Place of Birth</Text>
                <Text style={styles.rowValue}>{formData.birthPlace}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Address Details</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>State</Text>
              <Text style={styles.rowValue}>{address.state || 'Delhi'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>District</Text>
              <Text style={styles.rowValue}>{address.city || 'New Delhi'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>PIN Code</Text>
              <Text style={styles.rowValue}>{address.pincode || '110001'}</Text>
            </View>
          </View>
        </View>

        {/* Uploaded Documents Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.docsList}>
            {service.requiredDocuments.map((doc, idx) => (
              <View key={idx} style={styles.docRow}>
                <Ionicons name="document-text" size={16} color="#2563EB" />
                <Text style={styles.docNameText} numberOfLines={1}>
                  {doc.name.toLowerCase().replace(/\s+/g, '_')}.pdf
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.detailsList}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Government Fee</Text>
              <Text style={styles.rowValue}>₹{govtFeeRupees.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Convenience Fee</Text>
              <Text style={styles.rowValue}>₹{convenienceFeeRupees.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{totalPayableRupees.toFixed(2)}</Text>
            </View>
          </View>
        </View>

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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: {
    paddingBottom: spacing.md,
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
    marginBottom: spacing.md,
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
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerStep: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  detailsList: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  docsList: { gap: spacing.sm },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: 10,
    gap: 10,
  },
  docNameText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
