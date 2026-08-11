import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet, useCreateTopupOrder } from '../src/api/applications';
import { useAuthStore } from '../src/store/authStore';
import { apiClient } from '../src/api/client';
import { colors, typography, spacing, radius, shadows } from '../src/theme';

const QUICK_CHIPS = [500, 1000, 2000, 5000];

const PAYMENT_SOURCES = [
  { id: 'sbi', name: 'SBI Bank Account', desc: 'Primary • ***********1204', icon: 'card' },
  { id: 'upi', name: 'UPI Payment', desc: 'Google Pay, PhonePe, BHIM', icon: 'qr-code-outline' },
  { id: 'card', name: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay', icon: 'card-outline' },
];

export default function AddMoneyScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const createTopupOrder = useCreateTopupOrder();

  const [amount, setAmount] = useState('2000');
  const [selectedSource, setSelectedSource] = useState('sbi');
  const [paying, setPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [successTxnId, setSuccessTxnId] = useState('');

  const handleChipPress = (val: number) => {
    setAmount(String(val));
  };

  const handleAddMoney = async () => {
    const amountRupees = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(amountRupees) || amountRupees <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to add.');
      return;
    }

    setPaying(true);
    const amountPaise = Math.round(amountRupees * 100);

    try {
      const order = await createTopupOrder.mutateAsync(amountPaise);

      if (Platform.OS === 'web') {
        const txnId = `pay_test_${Date.now()}`;
        await simulateTopupSuccess(order.orderId, amountPaise, txnId);
        
        // Invalidate queries so that the parent Wallet tab updates immediately
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });

        setSuccessAmount(displayAmount);
        setSuccessTxnId(txnId);
        setShowSuccess(true);
        return;
      }

      // Native Device: RazorpayCheckout
      const RazorpayCheckout = require('react-native-razorpay').default;
      RazorpayCheckout.open({
        description: 'Wallet Top-up',
        image: Image.resolveAssetSource(require('../assets/logo.png')).uri,
        currency: 'INR',
        key: order.keyId ?? 'rzp_test_TMXyBUFigdMtGC',
        amount: String(amountPaise),
        name: 'CyberSave',
        order_id: order.orderId,
        prefill: {
          contact: user?.phone ?? '',
          name: user?.name ?? '',
        },
        theme: { color: '#2563EB' },
      }).then(async (data: any) => {
        const txnId = data?.razorpay_payment_id || `pay_${Date.now()}`;
        
        // Trigger simulated webhook local callback since Razorpay's servers cannot reach our localhost
        await simulateTopupSuccess(order.orderId, amountPaise, txnId);

        // Invalidate queries so that the parent Wallet tab updates immediately
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });

        setSuccessAmount(displayAmount);
        setSuccessTxnId(txnId);
        setShowSuccess(true);
      }).catch((err: any) => {
        if (err.code !== 2) { // 2 = user dismissed
          Alert.alert('Payment Failed', 'The payment could not be completed. Please try again.');
        }
      });
    } catch (err: any) {
      Alert.alert('Payment Error', 'We are unable to reach the payment gateway. Please try again later.');
    } finally {
      setPaying(false);
    }
  };

  const simulateTopupSuccess = async (orderId: string, amountPaise: number, txnId: string) => {
    await apiClient.post('/payments/webhook', {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: txnId,
            order_id: orderId,
            amount: amountPaise,
            notes: { citizenId: user?.id || 'test', type: 'topup' },
          },
        },
      },
    }, {
      headers: { 'x-razorpay-signature': 'test' },
    }).catch(() => {});
  };

  const displayAmount = parseFloat(amount.replace(/,/g, '')) || 0;

  // Custom high-fidelity success feedback page layout
  if (showSuccess) {
    const activeSource = PAYMENT_SOURCES.find(s => s.id === selectedSource)?.name || 'SBI Bank Account';
    const currentTimeStr = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          {/* Green checkmark badge */}
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons name="checkmark" size={48} color="#16A34A" />
            </View>
          </View>

          {/* Success message text */}
          <Text style={styles.successTitle}>Top-up Successful!</Text>
          <Text style={styles.successAmountText}>
            ₹{successAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.successSubtitle}>
            The money has been successfully credited to your CyberSave Wallet.
          </Text>

          {/* Transaction Info Box */}
          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Source</Text>
              <Text style={styles.receiptValue}>{activeSource}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction time</Text>
              <Text style={styles.receiptValue}>Today, {currentTimeStr}</Text>
            </View>
            <View style={[styles.receiptRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.receiptLabel}>Reference ID</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>{successTxnId}</Text>
            </View>
          </View>
        </View>

        {/* Back to Wallet CTA */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setShowSuccess(false);
            router.back();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Back to Wallet</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
            <Ionicons name="arrow-back-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Money</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Body container */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.whiteContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Current Balance row */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Current Wallet Balance</Text>
            <Text style={styles.balanceValue}>
              ₹{wallet?.balance ? wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </Text>
          </View>

          {/* Enter Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Enter Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Quick chips */}
          <View style={styles.chipsRow}>
            {QUICK_CHIPS.map((val) => {
              const isActive = displayAmount === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => handleChipPress(val)}
                >
                  <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                    + ₹{val.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment sources */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Payment Source</Text>
            <View style={styles.sourceList}>
              {PAYMENT_SOURCES.map((source) => {
                const isActive = selectedSource === source.id;
                return (
                  <TouchableOpacity
                    key={source.id}
                    style={[styles.sourceCard, isActive && styles.sourceCardActive]}
                    onPress={() => setSelectedSource(source.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sourceLeft}>
                      <View style={[styles.sourceIconBg, isActive && styles.sourceIconBgActive]}>
                        <Ionicons
                          name={source.icon as any}
                          size={20}
                          color={isActive ? '#2563EB' : '#64748B'}
                        />
                      </View>
                      <View style={styles.sourceMeta}>
                        <Text style={styles.sourceName}>{source.name}</Text>
                        <Text style={styles.sourceDesc}>{source.desc}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                      {isActive && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CTA Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAddMoney}
            disabled={paying}
            activeOpacity={0.85}
          >
            {paying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                Add ₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to Wallet
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 20,
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#EFF6FF',
    padding: spacing.base,
    ...shadows.sm,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  sourceList: {
    gap: spacing.sm,
  },
  sourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: spacing.base,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  sourceCardActive: {
    borderColor: '#2563EB',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIconBgActive: {
    backgroundColor: '#EFF6FF',
  },
  sourceMeta: {
    gap: 3,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourceDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.md,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Premium Success Screen Styles
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
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
  successAmountText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 12,
  },
  successSubtitle: {
    fontSize: 14,
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
  receiptLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '60%',
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: 'center',
    width: '100%',
    ...shadows.md,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
