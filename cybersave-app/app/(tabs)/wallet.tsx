import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWallet, useTransactions } from '../../src/api/applications';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

const fmtDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  // Check yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  }
};

export default function WalletScreen() {
    const { t } = useTranslation();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const { data: txns, refetch: refetchTxns, isRefetching } = useTransactions();

  const transactions = txns?.items ?? [];

  const handleRefresh = async () => {
    await Promise.all([refetchWallet(), refetchTxns()]);
  };

  return (
    <View style={styles.flex}>
      {/* Header (gradient drawing under status bar) */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>{t('wallet.wallet')}</Text>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Body */}
      <View style={styles.whiteContainer}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.balanceCardTop}>
            <View>
              <Text style={styles.balanceLabel}>{t('wallet.available_balance')}</Text>
              <Text style={styles.balanceAmount}>
                ₹{wallet?.balance ? wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => router.push('/add-money')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={28} color="#2563EB" />
            </TouchableOpacity>
          </View>
          <View style={styles.balanceCardBottom}>
            <Ionicons name="lock-closed" size={14} color="#FFFFFF" style={{ opacity: 0.8 }} />
            <Text style={styles.securedText}>{t('wallet.secured_by_cybersave_digital_t')}</Text>
          </View>
        </LinearGradient>

        {/* Transactions list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('wallet.recent_transactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.viewAll}>{t('wallet.view_all')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(t) => t._id ?? t.razorpayPaymentId ?? String(Math.random())}
          contentContainerStyle={transactions.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="card-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>{t('wallet.no_transactions_yet')}</Text>
              <Text style={styles.emptySub}>
                
                                      {t('wallet.top_up_your_wallet_or_submit_a')}
                                    </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isDebit = item.type === 'debit';
            return (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/transaction-details', params: { ...item } })}
                activeOpacity={0.7}
              >
                <View style={styles.txnCard}>
                  <View style={styles.txnLeft}>
                    <View
                      style={[
                        styles.txnIconBg,
                        { backgroundColor: isDebit ? '#FFE4E6' : '#DCFCE7' },
                      ]}
                    >
                      <Ionicons
                        name={isDebit ? 'document-text-outline' : 'add-circle-outline'}
                        size={20}
                        color={isDebit ? '#F43F5E' : '#22C55E'}
                      />
                    </View>
                    <View style={styles.txnMeta}>
                      <Text style={styles.txnDesc} numberOfLines={1}>{item.description}</Text>
                      <Text style={styles.txnDate}>{fmtDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.txnAmount,
                      { color: isDebit ? '#0F172A' : '#10B981' },
                    ]}
                  >
                    {isDebit ? '- ' : '+ '}₹{(item.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.linkedSection}>
              <Text style={styles.sectionTitle}>{t('wallet.linked_payment_methods')}</Text>
              <View style={styles.linkedCard}>
                <View style={styles.linkedLeft}>
                  <View style={styles.bankIconBg}>
                    <Ionicons name="card-outline" size={20} color="#0F172A" />
                  </View>
                  <View style={styles.linkedMeta}>
                    <Text style={styles.bankName}>{t('wallet.state_bank_of_india')}</Text>
                    <Text style={styles.bankDetail}>{t('wallet.primary_account_1204')}</Text>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
            </View>
          }
        />
      </View>
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
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginHorizontal: 20
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  addMoneyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securedText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Manrope',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAll: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  list: {
    gap: 12,
    paddingBottom: 110,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 110,
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txnIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMeta: {
    flex: 1,
    gap: 4,
  },
  txnDesc: {
    fontFamily: 'Manrope',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnDate: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
  },
  txnAmount: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
  },
  linkedSection: {
    marginTop: 24,
    gap: 12,
  },
  linkedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedMeta: {
    gap: 4,
  },
  bankName: {
    fontFamily: 'Manrope',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankDetail: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Manrope',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
    marginTop: 8,
  },
});

