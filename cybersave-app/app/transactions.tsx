import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTransactions } from '../src/api/applications';
import { colors, typography, spacing, radius, shadows } from '../src/theme';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credits' },
  { id: 'debit', label: 'Debits' },
  { id: 'refund', label: 'Refunds' },
];

const fmtTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getHeaderDate = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();

  if (isToday) {
    return `TODAY, ${formattedDate}`;
  } else if (isYesterday) {
    return `YESTERDAY, ${formattedDate}`;
  } else {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  }
};

export default function TransactionHistoryScreen() {
  const { data: txns, isLoading, refetch, isRefetching } = useTransactions();
  const [activeFilter, setActiveFilter] = useState('all');

  // Date filtering state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('all'); // 'all' | '7days' | '30days' | 'month' | 'custom'
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

  const transactions = txns?.items ?? [];

  // Helper: Parse DD/MM/YYYY into a valid Date object
  const parseDateStr = (str: string): Date | null => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  };

  const handleApplyDateFilter = () => {
    if (selectedPreset === 'all') {
      setAppliedStartDate(null);
      setAppliedEndDate(null);
    } else if (selectedPreset === '7days') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      setAppliedStartDate(start);
      setAppliedEndDate(new Date());
    } else if (selectedPreset === '30days') {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      setAppliedStartDate(start);
      setAppliedEndDate(new Date());
    } else if (selectedPreset === 'month') {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      setAppliedStartDate(start);
      setAppliedEndDate(new Date());
    } else if (selectedPreset === 'custom') {
      const start = parseDateStr(startDateStr);
      const end = parseDateStr(endDateStr);

      if (startDateStr && !start) {
        Alert.alert('Invalid Date', 'Please enter Start Date in DD/MM/YYYY format.');
        return;
      }
      if (endDateStr && !end) {
        Alert.alert('Invalid Date', 'Please enter End Date in DD/MM/YYYY format.');
        return;
      }

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      setAppliedStartDate(start);
      setAppliedEndDate(end);
    }
    setShowDatePicker(false);
  };

  // Filter transactions
  const filteredTxns = transactions.filter((t: any) => {
    // 1. Type query filter
    if (activeFilter === 'credit' && t.type !== 'credit') return false;
    if (activeFilter === 'debit' && t.type !== 'debit') return false;
    if (activeFilter === 'refund' && t.status !== 'refunded') return false;

    // 2. Date query filter
    const itemTime = new Date(t.createdAt).getTime();
    if (appliedStartDate && itemTime < appliedStartDate.getTime()) return false;
    if (appliedEndDate && itemTime > appliedEndDate.getTime()) return false;

    return true;
  });

  // Group by Date Headers
  const groupTransactions = () => {
    const groupsMap: { [key: string]: typeof transactions } = {};
    
    filteredTxns.forEach((item: any) => {
      const header = getHeaderDate(item.createdAt);
      if (!groupsMap[header]) {
        groupsMap[header] = [];
      }
      groupsMap[header].push(item);
    });

    return Object.keys(groupsMap).map((title) => ({
      title,
      data: groupsMap[title],
    }));
  };

  const sections = groupTransactions();

  // Find date range for header label
  const getDateRangeLabel = () => {
    if (appliedStartDate || appliedEndDate) {
      const format = (d: Date | null) => d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
      return `Showing: ${format(appliedStartDate)} - ${format(appliedEndDate)}`;
    }
    if (transactions.length === 0) return 'Showing: No Transactions';
    const dates = transactions.map((t: any) => new Date(t.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const format = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `Showing: ${format(minDate)} - ${format(maxDate)}`;
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
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity style={styles.headerRightBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Body curved white container */}
      <View style={styles.whiteContainer}>
        {/* Date Selector Row */}
        <TouchableOpacity style={styles.dateSelectorBox} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateSelectorLabel}>{getDateRangeLabel()}</Text>
          <Ionicons name="calendar" size={18} color="#2563EB" />
        </TouchableOpacity>

        {/* Filter Pills list */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setActiveFilter(filter.id)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* SectionList list transactions */}
        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(t) => t._id ?? t.razorpayPaymentId ?? String(Math.random())}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
            }
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => {
              const isDebit = item.type === 'debit';
              const isTopup = item.description?.toLowerCase().includes('top-up') || item.description?.toLowerCase().includes('topup');
              const refNo = item.razorpayPaymentId || item._id || '—';
              const shortRef = refNo.startsWith('pay_') ? refNo.slice(0, 18) + '…' : `TXN${refNo.slice(-8).toUpperCase()}`;
              
              // Extract service name from description — format: "ServiceName — Application Fee"
              const descParts = (item.description || '').split(' — ');
              const serviceName = isDebit && descParts.length >= 2 ? descParts[0] : null;
              const subDesc = isDebit && descParts.length >= 2 ? descParts[1] : item.description;

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
                          { backgroundColor: isDebit ? '#EFF6FF' : isTopup ? '#DCFCE7' : '#F3F4F6' },
                        ]}
                      >
                        <Ionicons
                          name={isDebit ? 'document-text' : isTopup ? 'wallet' : 'add-circle'}
                          size={20}
                          color={isDebit ? '#2563EB' : isTopup ? '#22C55E' : '#10B981'}
                        />
                      </View>
                      <View style={styles.txnMeta}>
                        {/* Primary line: service name (for debits) or description */}
                        <Text style={styles.txnDesc} numberOfLines={1}>
                          {serviceName ?? item.description}
                        </Text>
                        {/* Secondary line: sub-description or ref */}
                        {serviceName ? (
                          <Text style={styles.txnSub} numberOfLines={1}>
                            {subDesc} • {fmtTime(item.createdAt)}
                          </Text>
                        ) : (
                          <Text style={styles.txnSub}>
                            Ref: {shortRef} • {fmtTime(item.createdAt)}
                          </Text>
                        )}
                        {/* Application ref badge for service payments */}
                        {isDebit && item.applicationId && (
                          <View style={styles.refBadge}>
                            <Ionicons name="receipt-outline" size={10} color="#2563EB" />
                            <Text style={styles.refBadgeText} numberOfLines={1}>
                              {shortRef}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: isDebit ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      {isDebit ? '-' : '+'} ₹{(item.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="card-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySub}>
                  No transactions match the selected filters.
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date Range</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={styles.modalSubLabel}>Select Preset</Text>
            <View style={styles.presetRow}>
              {[
                { id: 'all', label: 'All Time' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'month', label: 'This Month' },
              ].map((p) => {
                const isSel = selectedPreset === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.presetChip, isSel && styles.presetChipActive]}
                    onPress={() => setSelectedPreset(p.id)}
                  >
                    <Text style={[styles.presetText, isSel && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.presetChip, selectedPreset === 'custom' && styles.presetChipActive]}
                onPress={() => setSelectedPreset('custom')}
              >
                <Text style={[styles.presetText, selectedPreset === 'custom' && styles.presetTextActive]}>
                  Custom Range
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Inputs */}
            {selectedPreset === 'custom' && (
              <View style={styles.customInputsWrapper}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Start Date (DD/MM/YYYY)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#94A3B8"
                    value={startDateStr}
                    onChangeText={setStartDateStr}
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>End Date (DD/MM/YYYY)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#94A3B8"
                    value={endDateStr}
                    onChangeText={setEndDateStr}
                  />
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyDateFilter}>
                <Text style={styles.applyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: spacing.lg,
  },
  dateSelectorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  dateSelectorLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  filtersWrapper: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  filtersContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    gap: 3,
  },
  txnDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  txnSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  refBadgeText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
    marginTop: spacing.xs,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  presetText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  customInputsWrapper: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  inputCol: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: {
    marginTop: spacing.sm,
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
