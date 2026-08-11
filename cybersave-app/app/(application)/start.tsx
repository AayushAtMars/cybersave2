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
import { router, useLocalSearchParams } from 'expo-router';
import { useService, useCreateApplication } from '../../src/api/applications';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { colors, spacing, radius, shadows } from '../../src/theme';

const STEPS = ['Fill Details', 'Upload Proofs', 'Review', 'Payment', 'Done'];

export default function StartApplicationScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { data: service, isLoading } = useService(serviceId);
  const createApp = useCreateApplication();
  const setDraft = useDraftStore((s) => s.setDraft);

  const handleStart = async () => {
    const app = await createApp.mutateAsync(serviceId);
    setDraft({
      id: app._id,
      applicationRefNo: app.applicationRefNo,
      serviceId: app.serviceId,
      serviceName: app.serviceName,
      totalAmount: app.totalAmount,
      govtFee: app.govtFee,
      convenienceFee: app.convenienceFee,
      currentStep: 1,
    });
    router.push('/(application)/step-1-personal');
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  if (!service) return null;

  const govtFeeRupees = service.govtFee / 100;
  const convenienceFeeRupees = service.convenienceFee / 100;
  const totalRupees = govtFeeRupees + convenienceFeeRupees;
  const slaDays = Math.ceil(service.slaHours / 24);

  return (
    <View style={styles.flex}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} />
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerDept} numberOfLines={1}>{service.department}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{service.name}</Text>
          </View>
        </View>

        {/* Service stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{totalRupees.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Fee</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{slaDays} days</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{service.requiredDocuments.length}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fee breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fee Breakdown</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Government Fee</Text>
            <Text style={styles.feeValue}>₹{govtFeeRupees.toFixed(0)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Convenience Fee</Text>
            <Text style={styles.feeValue}>₹{convenienceFeeRupees.toFixed(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.feeRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalRupees.toFixed(0)}</Text>
          </View>
          <View style={styles.slaChip}>
            <Ionicons name="time-outline" size={14} color="#D97706" />
            <Text style={styles.slaText}>Processing time: {slaDays} working days</Text>
          </View>
        </View>

        {/* Required documents */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents Required</Text>
          {service.requiredDocuments.map((doc, i) => (
            <View key={i} style={styles.docRow}>
              <View style={[styles.docBullet, !doc.mandatory && styles.docBulletOptional]} />
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docMeta}>
                  {doc.mandatory ? 'Mandatory' : 'Optional'} · {doc.acceptedFormats.join(', ').toUpperCase()} · Max {doc.maxSizeMb}MB
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Application steps preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Steps</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumBox}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Start CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, createApp.isPending && styles.ctaBtnDisabled]}
          onPress={handleStart}
          disabled={createApp.isPending}
          activeOpacity={0.85}
        >
          {createApp.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.ctaText}>Start Application</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerDept: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  slaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  slaText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  docRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  docBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginTop: 4,
    flexShrink: 0,
  },
  docBulletOptional: {
    backgroundColor: '#94A3B8',
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepNumBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  stepLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: spacing.sm,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
