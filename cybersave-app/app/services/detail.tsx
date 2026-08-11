import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useService } from '../../src/api/applications';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  // Fetch live service configuration from MongoDB
  const { data: service, isLoading } = useService(serviceId ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Service details could not be found.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate dynamic processing days from SLA hours
  const processingDays = Math.ceil(service.slaHours / 24);
  const totalFeeInRupees = (service.totalFee ?? (service.govtFee + service.convenienceFee)) / 100;

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
          <Text style={styles.headerTitle} numberOfLines={1}>{service.name}</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Main Container */}
      <ScrollView
        style={styles.whiteContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Official Registry Card banner */}
        <View style={styles.registryCard}>
          <View style={styles.registryIconBox}>
            <Ionicons name="ribbon" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.registryInfo}>
            <Text style={styles.registryTitle}>Official {service.name} Registry</Text>
            <Text style={styles.registrySubtitle}>
              Legally certified document issued by the {service.department}.
            </Text>
          </View>
        </View>

        {/* About This Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Service</Text>
          <Text style={styles.sectionDesc}>
            {service.description || `Apply for official ${service.name} processing. Crucial for legal validations, passport processes, and central identification registers.`}
          </Text>
        </View>

        {/* Eligibility criteria list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eligibility</Text>
          {(service.eligibility && service.eligibility.length > 0) ? (
            service.eligibility.map((el, index) => (
              <View key={index} style={styles.eligibilityRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.eligibilityText}>{el}</Text>
              </View>
            ))
          ) : (
            <View style={styles.eligibilityRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.eligibilityText}>Citizen of India</Text>
            </View>
          )}
        </View>

        {/* Documents Required */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Required</Text>
          {service.requiredDocuments && service.requiredDocuments.length > 0 ? (
            service.requiredDocuments.map((doc, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bulletText}>{doc.name}</Text>
              </View>
            ))
          ) : (
            <View style={styles.bulletRow}>
              <View style={styles.bulletPoint} />
              <Text style={styles.bulletText}>Aadhaar Card</Text>
            </View>
          )}
        </View>

        {/* Fee & SLA duration cards */}
        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Government Fee</Text>
            <Text style={styles.metaValue}>₹{totalFeeInRupees.toFixed(0)}</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Processing Time</Text>
            <Text style={styles.metaValue}>
              {processingDays === 1 ? '1 Day' : `${processingDays} Days`}
            </Text>
          </View>
        </View>

        {/* Apply Now Button */}
        <TouchableOpacity
          style={styles.applyBtn}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/(application)/start',
              params: { serviceId: service._id },
            })
          }
        >
          <Text style={styles.applyBtnText}>Apply Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: radius.md,
  },
  backLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
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
    flex: 1,
    paddingHorizontal: spacing.sm,
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
  registryCard: {
    backgroundColor: '#3B82F6',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  registryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registryInfo: {
    flex: 1,
    gap: 2,
  },
  registryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  registrySubtitle: {
    fontSize: 11,
    color: '#EFF6FF',
    lineHeight: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '600',
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eligibilityText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  bulletText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: 4,
    ...shadows.sm,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
