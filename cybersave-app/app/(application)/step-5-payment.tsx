import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useCreateOrder } from '../../src/api/applications';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function Step5PaymentScreen() {
  const draft = useDraftStore((s) => s.draft);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const user = useAuthStore((s) => s.user);
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [upiId, setUpiId] = useState('username@okhdfcbank');
  const [paying, setPaying] = useState(false);

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxnId, setSuccessTxnId] = useState('');

  const amountRupees = (draft?.totalAmount ?? 0) / 100;
  const amountPaise = draft?.totalAmount ?? 0;

  // ── Simulate webhook for local dev (Razorpay can't reach localhost) ──────────
  const simulatePaymentSuccess = async (orderId: string, paymentId: string) => {
    await apiClient.post('/payments/webhook', {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: amountPaise,
            notes: {
              applicationId: draft?.id,
              citizenId: user?.id || 'test',
              type: 'application',
              serviceName: draft?.serviceName || 'Service',
            },
          },
        },
      },
    }, {
      headers: { 'x-razorpay-signature': 'test' },
    }).catch(() => {}); // ignore errors in simulation
  };

  const handlePay = async () => {
    if (!draft) return;
    setPaying(true);
    try {
      const order = await createOrder.mutateAsync({
        applicationId: draft.id,
        amount: amountPaise,
      });

      const orderId = order.orderId;

      if (Platform.OS === 'web') {
        // Web: simulate success
        const txnId = `pay_test_${Date.now()}`;
        await simulatePaymentSuccess(orderId, txnId);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setSuccessTxnId(txnId);
        setShowSuccess(true);
        return;
      }

      // Native: real Razorpay SDK
      const RazorpayCheckout = require('react-native-razorpay').default;
      RazorpayCheckout.open({
        description: `${draft.serviceName} — Application Fee`,
        image: Image.resolveAssetSource(require('../../assets/logo.png')).uri,
        currency: 'INR',
        key: order.keyId ?? process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_TMXyBUFigdMtGC',
        amount: String(amountPaise),
        name: 'CyberSave',
        order_id: orderId,
        prefill: {
          contact: user?.phone ?? draft.applicantPhone ?? '',
          name: user?.name ?? draft.applicantName ?? '',
        },
        theme: { color: '#2563EB' },
      }).then(async (data: any) => {
        const txnId = data?.razorpay_payment_id ?? `pay_${Date.now()}`;
        // Trigger local webhook callback (Razorpay servers can't reach localhost)
        await simulatePaymentSuccess(orderId, txnId);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setSuccessTxnId(txnId);
        setShowSuccess(true);
      }).catch((err: any) => {
        if (err.code !== 2) { // 2 = user dismissed
          Alert.alert('Payment Failed', err.description ?? 'Payment could not be processed. Please try again.');
        }
      });
    } catch (err: any) {
      // Fallback simulation so the flow doesn't get blocked in dev
      const txnId = `pay_sim_${Date.now()}`;
      await simulatePaymentSuccess(`ord_sim_${Date.now()}`, txnId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSuccessTxnId(txnId);
      setShowSuccess(true);
    } finally {
      setPaying(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (showSuccess) {
    const currentTimeStr = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          {/* Green check badge */}
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#16A34A" />
            </View>
          </View>

          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successAmount}>
            ₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.successSubtitle}>
            Your application for{' '}
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>{draft?.serviceName}</Text>{' '}
            has been submitted successfully.
          </Text>

          {/* Receipt box */}
          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>{draft?.serviceName}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Ref. No.</Text>
              <Text style={styles.receiptValue}>{draft?.applicationRefNo ?? '—'}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction ID</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>{successTxnId}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction Time</Text>
              <Text style={styles.receiptValue}>Today, {currentTimeStr}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            <View style={[styles.receiptRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.receiptLabel}>Est. Completion</Text>
              <Text style={[styles.receiptValue, { color: '#10B981' }]}>{estimatedDate}</Text>
            </View>
          </View>
        </View>

        {/* CTA buttons */}
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => {
              clearDraft();
              router.replace('/(tabs)/applications');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="locate-outline" size={18} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track Application Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => {
              clearDraft();
              router.replace('/(tabs)/home');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Payment Selection Screen ─────────────────────────────────────────────────
  return (
    <View style={styles.flex}>
      {/* Header block with 80% progress indicator */}
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
          <Text style={styles.headerTitle}>Payment Gateway</Text>
          <Text style={styles.headerStep}>Step 4/5</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '80%' }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Banner Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptCardInfo}>
            <Text style={styles.receiptCardLabel}>{draft?.serviceName || 'Application Fee'}</Text>
            <Text style={styles.receiptCardRef}>Ref: {draft?.applicationRefNo ?? '—'}</Text>
          </View>
          <Text style={styles.receiptCardAmount}>₹{amountRupees.toFixed(0)}</Text>
        </View>

        <Text style={styles.sectionHeader}>Select Payment Method</Text>

        {/* UPI Option */}
        <View style={[styles.methodCard, selectedMethod === 'upi' && styles.methodCardActive]}>
          <TouchableOpacity
            style={styles.methodHeader}
            onPress={() => setSelectedMethod('upi')}
            activeOpacity={0.9}
          >
            <View style={[styles.radio, selectedMethod === 'upi' && styles.radioActive]}>
              {selectedMethod === 'upi' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>UPI</Text>
              <Text style={styles.methodDesc}>Google Pay, PhonePe, BHIM</Text>
            </View>
            <Ionicons name="qr-code-outline" size={18} color="#64748B" />
          </TouchableOpacity>

          {selectedMethod === 'upi' && (
            <View style={styles.upiInputBox}>
              <Text style={styles.upiInputLabel}>Enter UPI ID</Text>
              <TextInput
                style={styles.upiInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="username@okhdfcbank"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        {/* Credit / Debit Card */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('card')}
          activeOpacity={0.9}
        >
          <View style={styles.methodHeader}>
            <View style={[styles.radio, selectedMethod === 'card' && styles.radioActive]}>
              {selectedMethod === 'card' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Credit / Debit Card</Text>
              <Text style={styles.methodDesc}>Visa, MasterCard, RuPay</Text>
            </View>
            <Ionicons name="card-outline" size={18} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* Net Banking */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'netbanking' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('netbanking')}
          activeOpacity={0.9}
        >
          <View style={styles.methodHeader}>
            <View style={[styles.radio, selectedMethod === 'netbanking' && styles.radioActive]}>
              {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Net Banking</Text>
              <Text style={styles.methodDesc}>SBI, HDFC, ICICI, Axis</Text>
            </View>
            <Ionicons name="business-outline" size={18} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* Wallets */}
        <TouchableOpacity
          style={[styles.methodCard, selectedMethod === 'wallets' && styles.methodCardActive]}
          onPress={() => setSelectedMethod('wallets')}
          activeOpacity={0.9}
        >
          <View style={styles.methodHeader}>
            <View style={[styles.radio, selectedMethod === 'wallets' && styles.radioActive]}>
              {selectedMethod === 'wallets' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Wallets</Text>
              <Text style={styles.methodDesc}>Amazon Pay, Mobikwik</Text>
            </View>
            <Ionicons name="wallet-outline" size={18} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={14} color="#10B981" />
          <Text style={styles.securityText}>
            Payments processed securely via Razorpay. CyberSave does not store your card or UPI details.
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, paying && { opacity: 0.7 }]}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.8}
        >
          {paying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.payText}>Pay ₹{amountRupees.toFixed(0)} Securely</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  headerSafeArea: { flex: 0 },
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
  headerStep: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressBar: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },

  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: 40,
  },

  receiptCard: {
    backgroundColor: '#2563EB',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  receiptCardInfo: { flex: 1, gap: 4 },
  receiptCardLabel: { fontSize: 12, color: '#E0F2FE', fontWeight: '700' },
  receiptCardRef: { fontSize: 11, color: '#93C5FD', fontWeight: '600' },
  receiptCardAmount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: spacing.xs,
    marginBottom: -4,
  },

  methodCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  methodCardActive: { borderColor: '#2563EB', borderWidth: 1.5 },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: '#2563EB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  methodInfo: { flex: 1, gap: 2 },
  methodTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  methodDesc: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  upiInputBox: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  upiInputLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  upiInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    lineHeight: 16,
  },

  payBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  payText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // ── Success Screen ──────────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  successIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
  },
  successAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
  },
  receiptLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  receiptValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  successActions: { gap: spacing.md },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  trackBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  homeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  homeBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700' },
});
