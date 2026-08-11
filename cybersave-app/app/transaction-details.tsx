import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, radius, shadows } from '../src/theme';

const fmtDateDetail = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr}, ${timeStr}`;
};

export default function TransactionDetailsScreen() {
  const params = useLocalSearchParams();
  const {
    id,
    amount,
    description,
    createdAt,
    type,
    status,
    razorpayOrderId,
    razorpayPaymentId,
  } = params as {
    id: string;
    amount: string;
    description: string;
    createdAt: string;
    type: string;
    status: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
  };

  const amountVal = parseFloat(amount) || 0;
  const isDebit = type === 'debit';
  const refNo = razorpayPaymentId || id || '—';
  const shortRef = refNo.startsWith('pay_') ? refNo : `CS${refNo.slice(-8).toUpperCase()}`;

  // Smart derived fields matching the mockup aesthetics
  const paymentMethod = isDebit ? 'Wallet Balance' : 'SBI Bank Account';
  const serviceCategory = isDebit ? 'Digital Governance Fees' : 'Wallet Top-up';
  const beneficiaryService = isDebit ? description : 'Wallet Refill';

  const handleDownloadReceipt = () => {
    Alert.alert('Download Started', 'The official receipt is downloading to your device.');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing options initiated.');
  };

  return (
    <View style={styles.flex}>
      {/* Header Gradient (Extended over status bar) */}
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
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity style={styles.headerRightBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Container */}
      <ScrollView style={styles.whiteContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.successIconOuter, { backgroundColor: status === 'failed' ? '#FEE2E2' : '#DCFCE7' }]}>
            <View style={[styles.successIconInner, { backgroundColor: status === 'failed' ? '#FFCDCD' : '#E8F5E9' }]}>
              <Ionicons
                name={status === 'failed' ? 'close' : 'checkmark'}
                size={32}
                color={status === 'failed' ? '#EF4444' : '#16A34A'}
              />
            </View>
          </View>

          <Text style={styles.statusText}>
            {status === 'failed' ? 'Payment Failed' : 'Payment Successful'}
          </Text>
          
          <Text style={styles.amountText}>
            ₹{(amountVal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>

          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText}>Ref: {shortRef}</Text>
          </View>
        </View>

        {/* Detailed Fields List Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{razorpayPaymentId || id || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{fmtDateDetail(createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{paymentMethod}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Category</Text>
            <Text style={styles.detailValue}>{serviceCategory}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.detailLabel}>Beneficiary Service</Text>
            <Text style={styles.detailValue}>{beneficiaryService}</Text>
          </View>
        </View>

        {/* Download Receipt CTA */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReceipt} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.downloadBtnText}>Download Official Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1E3A8A' },
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
  headerRightBtn: {
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
    padding: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginTop: spacing.md,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  refBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  refBadgeText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: spacing.lg,
    gap: spacing.base,
    ...shadows.sm,
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.base,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  downloadBtnText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
});
