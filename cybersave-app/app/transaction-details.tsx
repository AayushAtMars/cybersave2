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
import { useTranslation } from "react-i18next";

const fmtDateDetail = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateStr}, ${timeStr}`;
};

export default function TransactionDetailsScreen() {
    const { t } = useTranslation();
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

  const handleDownloadReceipt = async () => {
    try {
      const { printToFileAsync } = await import('expo-print');
      const { shareAsync } = await import('expo-sharing');

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 28px; font-weight: bold; color: #1E3A8A; margin-bottom: 5px; }
              .subtitle { font-size: 16px; color: #64748B; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
              .label { font-size: 14px; font-weight: bold; color: #64748B; }
              .value { font-size: 14px; font-weight: bold; color: #0F172A; text-align: right; }
              .amount-container { text-align: center; margin: 30px 0; }
              .amount { font-size: 42px; font-weight: bold; color: ${isFailed ? '#EF4444' : '#10B981'}; }
              .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 10px; background-color: ${isFailed ? '#FEE2E2' : '#ECFDF5'}; color: ${isFailed ? '#EF4444' : '#10B981'}; }
              .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94A3B8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Official Receipt</div>
              <div class="subtitle">Cybersave Transaction</div>
            </div>
            
            <div class="amount-container">
              <div class="status-badge">${isFailed ? 'Payment Failed' : 'Payment Successful'}</div>
              <div class="amount">₹${(amountVal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            
            <div class="row">
              <span class="label">Transaction ID</span>
              <span class="value">${razorpayPaymentId || id || '—'}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time</span>
              <span class="value">${fmtDateDetail(createdAt)}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${paymentMethod}</span>
            </div>
            <div class="row">
              <span class="label">Service Category</span>
              <span class="value">${serviceCategory}</span>
            </div>
            <div class="row">
              <span class="label">Beneficiary Service</span>
              <span class="value">${beneficiaryService}</span>
            </div>
            
            <div class="footer">
              <p>This is a computer-generated receipt and does not require a physical signature.</p>
              <p>Generated on ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await printToFileAsync({ html, base64: false });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Official Receipt' });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  const handleShare = async () => {
    // We can just use the same logic for share button or a simpler text share.
    // For now, let's reuse the receipt generation for share as well, as it's the most useful thing to share.
    await handleDownloadReceipt();
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
          <Text style={styles.headerTitle}>{t('transaction-details.transaction_details')}</Text>
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
            <Text style={[styles.refBadgeText, { color: themeColor }]}>{t('transaction-details.ref')} {shortRef}</Text>
          </View>
        </View>

        {/* Detailed Fields List Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transaction-details.transaction_id')}</Text>
            <Text style={styles.detailValue}>{razorpayPaymentId || id || '—'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transaction-details.date_time')}</Text>
            <Text style={styles.detailValue}>{fmtDateDetail(createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transaction-details.payment_method')}</Text>
            <Text style={styles.detailValue}>{paymentMethod}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('transaction-details.service_category')}</Text>
            <Text style={styles.detailValue}>{serviceCategory}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.detailLabel}>{t('transaction-details.beneficiary_service')}</Text>
            <Text style={styles.detailValue}>{beneficiaryService}</Text>
          </View>
        </View>

        {/* Download Receipt CTA */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReceipt} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.downloadBtnText}>{t('transaction-details.download_official_receipt')}</Text>
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

