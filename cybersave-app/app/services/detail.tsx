import React, { useState } from 'react';
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
import { useService, useCreateApplication } from '../../src/api/applications';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  // Fetch live service configuration from MongoDB
  const { data: service, isLoading } = useService(serviceId ?? '');
  const createApp = useCreateApplication();
  const setDraft = useDraftStore((s) => s.setDraft);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleApplyNow = async () => {
    try {
      setIsCreating(true);
      const app = await createApp.mutateAsync(serviceId ?? '');
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
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
          <Text style={styles.headerTitle} numberOfLines={1}>{service.name}</Text>
          <View style={styles.placeholderWidth} />
        </View>
      </LinearGradient>

      {/* Main Floating Container */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Official Registry Card Banner */}
          <View style={styles.registryCard}>
            <View style={styles.registryInfo}>
              <Text style={styles.registryTitle}>Official {service.name} Registry</Text>
              <Text style={styles.registrySubtitle}>
                Legally certified document by the {service.department || 'Municipal Registrar of Births and Deaths'}.
              </Text>
            </View>
            <View style={styles.registryIconBox}>
              <Ionicons name="ribbon-outline" size={32} color="#FFFFFF" />
            </View>
          </View>

          {/* Details Stack */}
          <View style={styles.detailsStack}>
            {/* About This Service */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>About This Service</Text>
              <Text style={styles.sectionDesc}>
                {service.description || `Get official ${service.name} Certificates issued by state/central bodies. Crucial for school admissions, passport applications, and identity proofs.`}
              </Text>
            </View>

            {/* Eligibility */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Eligibility</Text>
              {(service.eligibility && service.eligibility.length > 0) ? (
                service.eligibility.map((el, index) => (
                  <View key={index} style={styles.row}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.rowText}>{el}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.row}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.rowText}>Citizen of India</Text>
                  </View>
                  <View style={styles.row}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.rowText}>Birth occurred within state limits</Text>
                  </View>
                  <View style={styles.row}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.rowText}>Registered within 21 days (Standard fee)</Text>
                  </View>
                </>
              )}
            </View>

            {/* Documents Required */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Documents Required</Text>
              {service.requiredDocuments && service.requiredDocuments.length > 0 ? (
                service.requiredDocuments.map((doc, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.rowText}>{doc.name}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.rowText}>Proof of Birth from Hospital</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.rowText}>ID Proof of Parents (Aadhaar/PAN)</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.rowText}>Marriage Certificate of Parents</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.rowText}>Address Proof (Utility Bill)</Text>
                  </View>
                </>
              )}
            </View>

            {/* Fee & SLA Duration Cards */}
            <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Government Fee</Text>
                <Text style={styles.feeValue}>₹{totalFeeInRupees.toFixed(0)}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Processing Time</Text>
                <Text style={styles.metaValue}>
                  {processingDays === 1 ? '1 Day' : `${processingDays === 0 ? '7-15' : processingDays} Days`}
                </Text>
              </View>
            </View>

            {/* Additional Charges Section */}
            {service.additionalCharges && service.additionalCharges.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Additional Options / Processing Fees</Text>
                {service.additionalCharges.map((ch: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{ch.name}</Text>
                      {ch.condition ? <Text style={{ fontSize: 11, color: '#64748B' }}>{ch.condition}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#EF4444' }}>+₹{ch.amount}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Payment & Refund Info Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Payment & Refund Information</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                {(service.paymentMethods && service.paymentMethods.length > 0 ? service.paymentMethods : ['Online Payment', 'UPI']).map((m: string, idx: number) => (
                  <View key={idx} style={{ backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 100 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>{m}</Text>
                  </View>
                ))}
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>Refund Policy:</Text>
                <Text style={{ fontSize: 12, color: '#0F172A', marginTop: 2 }}>{service.refundPolicy || 'Non-refundable after processing starts'}</Text>
              </View>
            </View>

            {/* Apply Now Button */}
            <TouchableOpacity
              style={[styles.applyBtn, isCreating && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleApplyNow}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.applyBtnText}>Apply Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: 'System',
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
    fontFamily: 'System',
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
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
    paddingTop: spacing.xs,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholderWidth: {
    width: 40,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: -24,
    marginBottom: 16,
    paddingVertical: 20,
    borderWidth: 0,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  registryCard: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  registryIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.125)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registryInfo: {
    flex: 1,
    gap: 6,
  },
  registryTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  registrySubtitle: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 16,
  },
  detailsStack: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  sectionDesc: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  rowText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  metaLabel: {
    fontFamily: 'System',
    fontSize: 11,
    color: '#64748B',
    lineHeight: 13,
  },
  feeValue: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    lineHeight: 23,
  },
  metaValue: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});

