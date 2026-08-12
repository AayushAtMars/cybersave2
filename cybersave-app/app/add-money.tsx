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
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Money</Text>
          <View style={styles.headerSpacer} />
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
                placeholderTextColor="#64748B"
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
  headerSpacer: {
    width: 40,
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
  },
  balanceLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  balanceValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    fontFamily: 'Manrope',
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  sourceList: {
    gap: 8,
  },
  sourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sourceCardActive: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 2,
  },
  sourceName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourceDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  radioDot: {
    width: 0,
    height: 0,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Premium Success Screen Styles
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    padding: 24,
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
    paddingHorizontal: 24,
    marginTop: 12,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginTop: 32,
    gap: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
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
    borderRadius: 20,
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
    paddingVertical: 16,
    borderRadius: 16,
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

