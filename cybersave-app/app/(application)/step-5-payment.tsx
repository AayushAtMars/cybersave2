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
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useCreateOrder, useService } from '../../src/api/applications';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function Step5PaymentScreen() {
  const draft = useDraftStore((s) => s.draft);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const user = useAuthStore((s) => s.user);
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { data: service } = useService(draft?.serviceId ?? '');

  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [upiId, setUpiId] = useState('username@okhdfcbank');
  const [paying, setPaying] = useState(false);

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTxnId, setSuccessTxnId] = useState('');

  // Error screen state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const amountRupees = (draft?.totalAmount ?? 5500) / 100;
  const amountPaise = draft?.totalAmount ?? 5500;

  const parseErrorDescription = (err: any): string => {
    if (!err) return 'Payment could not be processed. Please try again.';
    
    // Check if error is a stringified JSON
    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err);
        if (parsed.error && typeof parsed.error === 'object') {
          return parsed.error.description || parsed.error.reason || err;
        }
        return parsed.description || parsed.reason || err;
      } catch {
        return err;
      }
    }

    if (err.description) return err.description;
    if (err.message) return err.message;
    
    if (err.error) {
      if (typeof err.error === 'object') {
        return err.error.description || err.error.reason || 'Payment could not be processed. Please try again.';
      }
      try {
        const parsed = JSON.parse(err.error);
        return parsed.error?.description || parsed.description || err.error;
      } catch {
        return err.error;
      }
    }
    
    return 'Payment could not be processed. Please try again.';
  };

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
    let succeeded = false;
    try {
      const order = await createOrder.mutateAsync({
        applicationId: draft.id,
        amount: amountPaise,
      });

      const orderId = order.orderId;

      if (Platform.OS === 'web') {
        const txnId = `pay_test_${Date.now()}`;
        await simulatePaymentSuccess(orderId, txnId);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setSuccessTxnId(txnId);
        succeeded = true;
        setShowSuccess(true);
        return;
      }

      const RazorpayCheckout = require('react-native-razorpay').default;
      await RazorpayCheckout.open({
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
        await simulatePaymentSuccess(orderId, txnId);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        setSuccessTxnId(txnId);
        succeeded = true;
        setShowSuccess(true);
      }).catch((err: any) => {
        if (err.code !== 2) {
          setErrorMessage(parseErrorDescription(err));
          setErrorDetails(err);
          setErrorModalVisible(true);
        }
      });
    } catch (err: any) {
      const txnId = `pay_sim_${Date.now()}`;
      await simulatePaymentSuccess(`ord_sim_${Date.now()}`, txnId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSuccessTxnId(txnId);
      succeeded = true;
      setShowSuccess(true);
    } finally {
      if (!succeeded) {
        setPaying(false);
      }
    }
  };

  if (showSuccess) {
    const currentTimeStr = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const submissionDateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) + `, ${currentTimeStr}`;
    
    const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    return (
      <View style={styles.successContainer}>
        <SafeAreaView edges={['top']} style={{ flex: 0 }} />
        <ScrollView 
          contentContainerStyle={styles.successScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Check badge group */}
          <View style={styles.successIconGroup}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={36} color="#2563EB" />
              </View>
            </View>
          </View>

          {/* Success message texts */}
          <View style={styles.successTextContainer}>
            <Text style={styles.successTitle}>Application Submitted Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your request has been filed with the {service?.department || 'Municipal Health Department'}.
            </Text>
          </View>

          {/* Receipt box card */}
          <View style={styles.receiptBox}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderLabel}>Application Reference Number</Text>
              <Text style={styles.receiptHeaderRef}>{draft?.applicationRefNo || 'CSB2024001234'}</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptList}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Service Name</Text>
                <Text style={styles.receiptValue} numberOfLines={1}>{draft?.serviceName || 'Birth Certificate'}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date of Submission</Text>
                <Text style={styles.receiptValue}>{submissionDateStr}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Est. Completion</Text>
                <Text style={[styles.receiptValue, { color: '#10B981', fontWeight: '700' }]}>{estimatedDate} (7 Days)</Text>
              </View>
            </View>
          </View>

          {/* Actions footer */}
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => {
                clearDraft();
                router.replace('/(tabs)/applications');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.trackBtnText}>Track Application Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => {
                Alert.alert('Download Started', 'Your receipt is downloading...');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.downloadBtnText}>Download Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => {
                clearDraft();
                router.replace('/(tabs)/home');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>Back to Home Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

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
          <Text style={styles.headerTitle} numberOfLines={1}>Payment Gateway</Text>
          <Text style={styles.headerStep}>Step 4/5</Text>
        </View>
        {/* Progress track */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '80%' }]} />
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
            {/* Amount Banner Card */}
            <View style={styles.amountCard}>
              <View style={styles.amountLeft}>
                <Text style={styles.paymentInfoText} numberOfLines={1}>
                  Payment for {draft?.serviceName || 'Birth Certificate'}
                </Text>
                <Text style={styles.appRefText}>
                  Application {draft?.applicationRefNo || 'CSC-2024'}
                </Text>
              </View>
              <Text style={styles.amountValue}>₹{amountRupees.toFixed(0)}</Text>
            </View>

            <Text style={styles.sectionHeader}>Select Payment Method</Text>

            {/* UPI Option */}
            <View style={[styles.methodCard, selectedMethod === 'upi' ? styles.methodCardActive : styles.methodCardInactive]}>
              <TouchableOpacity
                style={styles.methodHeader}
                onPress={() => setSelectedMethod('upi')}
                activeOpacity={0.9}
              >
                <View style={[styles.radio, selectedMethod === 'upi' ? styles.radioActive : styles.radioInactive]}>
                  {selectedMethod === 'upi' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>UPI</Text>
                  <Text style={styles.methodDesc}>Google Pay, PhonePe, Paytm</Text>
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
              style={[styles.methodCard, selectedMethod === 'card' ? styles.methodCardActive : styles.methodCardInactive]}
              onPress={() => setSelectedMethod('card')}
              activeOpacity={0.9}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radio, selectedMethod === 'card' ? styles.radioActive : styles.radioInactive]}>
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
              style={[styles.methodCard, selectedMethod === 'netbanking' ? styles.methodCardActive : styles.methodCardInactive]}
              onPress={() => setSelectedMethod('netbanking')}
              activeOpacity={0.9}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radio, selectedMethod === 'netbanking' ? styles.radioActive : styles.radioInactive]}>
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
              style={[styles.methodCard, selectedMethod === 'wallets' ? styles.methodCardActive : styles.methodCardInactive]}
              onPress={() => setSelectedMethod('wallets')}
              activeOpacity={0.9}
            >
              <View style={styles.methodHeader}>
                <View style={[styles.radio, selectedMethod === 'wallets' ? styles.radioActive : styles.radioInactive]}>
                  {selectedMethod === 'wallets' && <View style={styles.radioDot} />}
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodTitle}>Wallets</Text>
                  <Text style={styles.methodDesc}>Amazon Pay, Mobikwik</Text>
                </View>
                <Ionicons name="wallet-outline" size={18} color="#64748B" />
              </View>
            </TouchableOpacity>

            {/* Pay Button */}
            <TouchableOpacity
              style={styles.payBtn}
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
      </KeyboardAvoidingView>

      {/* Styled Error Modal */}
      <Modal
        visible={errorModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModalContent}>
            <View style={styles.errorIconOuter}>
              <View style={styles.errorIconInner}>
                <Ionicons name="close" size={40} color="#DC2626" />
              </View>
            </View>
            
            <Text style={styles.errorModalTitle}>Payment Failed</Text>
            <Text style={styles.errorModalSubtitle}>
              {errorMessage}
            </Text>

            {errorDetails && (
              <View style={styles.errorDetailsBox}>
                <Text style={styles.errorDetailsLabel}>Technical Details</Text>
                <Text style={styles.errorDetailsText}>
                  Code: {errorDetails.code || (typeof errorDetails.error === 'string' && JSON.parse(errorDetails.error).error?.code) || 'BAD_REQUEST_ERROR'}{'\n'}
                  Step: {errorDetails.step || (typeof errorDetails.error === 'string' && JSON.parse(errorDetails.error).error?.step) || 'payment_authentication'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.retryModalBtn}
              onPress={() => {
                setErrorModalVisible(false);
                handlePay();
              }}
            >
              <Text style={styles.retryModalText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Processing Overlay */}
      {paying && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing Payment...</Text>
          <Text style={styles.processingSubtext}>Please do not close the app or press back</Text>
        </View>
      )}
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
  amountCard: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLeft: {
    flex: 1,
    gap: 4,
  },
  paymentInfoText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  appRefText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  amountValue: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginTop: 4,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  methodCardActive: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  methodCardInactive: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderWidth: 6,
    borderColor: '#2563EB',
  },
  radioInactive: {
    borderWidth: 1.5,
    borderColor: '#64748B',
  },
  radioDot: {
    // Hidden since the active state is simulated by thick border
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodTitle: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  methodDesc: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  upiInputBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    gap: 8,
  },
  upiInputLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  upiInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  payBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.lg,
  },
  errorIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorModalSubtitle: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  errorDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  errorDetailsLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  errorDetailsText: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  retryModalBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retryModalText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelModalBtn: {
    height: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    color: '#64748B',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
  },

  // Processing Overlay styles
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    gap: 16,
  },
  processingText: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  processingSubtext: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#94A3B8',
  },

  // ── Success Screen Styles ──────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  successScrollContent: {
    padding: 24,
    gap: 32,
    alignItems: 'center',
    paddingBottom: 40,
  },
  successIconGroup: {
    paddingTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.125)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  successTitle: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 33,
  },
  successSubtitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '400',
    color: '#DBEAFE',
    textAlign: 'center',
    lineHeight: 18,
  },
  receiptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    gap: 16,
  },
  receiptHeader: {
    gap: 4,
    width: '100%',
  },
  receiptHeaderLabel: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 15,
  },
  receiptHeaderRef: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  receiptDivider: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E2E8F0',
    height: 0,
    width: '100%',
  },
  receiptList: {
    gap: 12,
    width: '100%',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  receiptLabel: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 16,
  },
  receiptValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  successActions: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  trackBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  trackBtnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  downloadBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  downloadBtnText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeBtn: {
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 12,
  },
  homeBtnText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#DBEAFE',
  },
});
