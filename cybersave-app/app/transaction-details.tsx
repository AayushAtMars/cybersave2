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

  const isFailed = status === 'failed';
  const themeColor = isFailed ? '#EF4444' : '#10B981';
  const themeBg = isFailed ? '#FEE2E2' : '#ECFDF5';

  return (
    <View style={styles.flex}>
      {/* Header Gradient (Extended over status bar) */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity style={styles.headerRightBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Container */}
      <ScrollView style={styles.whiteContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.successIconOuter, { backgroundColor: themeBg }]}>
            <Ionicons
              name={isFailed ? 'close-outline' : 'checkmark-outline'}
              size={32}
              color={themeColor}
            />
          </View>

          <Text style={styles.statusText}>
            {isFailed ? 'Payment Failed' : 'Payment Successful'}
          </Text>
          
          <Text style={styles.amountText}>
            ₹{(amountVal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>

          <View style={[styles.refBadge, { backgroundColor: themeBg }]}>
            <Text style={[styles.refBadgeText, { color: themeColor }]}>Ref: {shortRef}</Text>
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
          <Ionicons name="download-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.downloadBtnText}>Download Official Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerRightBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginHorizontal:20
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  successIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 12,
  },
  amountText: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  refBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  refBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    gap: 4,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  detailValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  downloadBtnText: {
    fontFamily: 'Inter',
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
});

