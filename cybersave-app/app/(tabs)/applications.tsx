import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApplications } from '../../src/api/applications';
import { shadows, spacing, radius } from '../../src/theme';
import { EmptyApplications, SkeletonScreen, SystemError, NoInternet } from '../../src/components/UIStates';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'submitted' },
  { label: 'Approved', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Draft',       color: '#64748B', bg: '#F1F5F9' },
  submitted:    { label: 'Pending',     color: '#D97706', bg: '#FEF3C7' },
  under_review: { label: 'In Progress', color: '#2563EB', bg: '#EFF6FF' },
  docs_pending: { label: 'In Progress', color: '#2563EB', bg: '#EFF6FF' },
  processing:   { label: 'In Progress', color: '#2563EB', bg: '#EFF6FF' },
  completed:    { label: 'Approved',    color: '#16A34A', bg: '#DCFCE7' },
  rejected:     { label: 'Rejected',    color: '#DC2626', bg: '#FEE2E2' },
};

export default function ApplicationsScreen() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useApplications(statusFilter);
  const { isConnected } = useNetworkStatus();

  const allApps = data?.items ?? [];

  // When "All" tab is selected, exclude drafts (incomplete wizard sessions)
  const baseApps = statusFilter === undefined
    ? allApps.filter((a) => a.status !== 'draft')
    : allApps;

  const apps = search
    ? baseApps.filter(
        (a) =>
          a.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          a.applicationRefNo.toLowerCase().includes(search.toLowerCase())
      )
    : baseApps;

  const cfg = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;

  return (
    <View style={styles.flex}>
      <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} />
        <Text style={styles.headerTitle}>My Applications</Text>
      </LinearGradient>

      {/* White curved body */}
      <View style={styles.body}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applications..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <TouchableOpacity
                key={f.label}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setStatusFilter(f.value)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* State: No internet */}
        {isConnected === false ? (
          <NoInternet onRetry={() => refetch()} />
        ) : isLoading ? (
          <SkeletonScreen />
        ) : isError ? (
          <SystemError
            errorCode="ERR_FETCH_APPLICATIONS"
            onRetry={() => refetch()}
            onHome={() => router.replace('/(tabs)/home')}
            hideHeader={true}
          />
        ) : apps.length === 0 ? (
          <EmptyApplications onBrowse={() => router.push('/(tabs)/services')} />
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(a) => a._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const s = cfg(item.status);
              const isApproved = item.status === 'completed';
              const isRejected = item.status === 'rejected';

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/(application)/status', params: { id: item._id } })}
                  activeOpacity={0.82}
                >
                  <View style={styles.cardRow}>
                    {/* Icon */}
                    <View style={styles.cardIcon}>
                      <Ionicons name="document-text" size={22} color="#2563EB" />
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.serviceName}</Text>
                        <Text style={[styles.statusBadge, { color: s.color }]}>{s.label}</Text>
                      </View>
                      <Text style={styles.cardMeta}>
                        ID: {item.applicationRefNo} • Submitted {fmtDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Download Certificate — shown for approved */}
                  {isApproved && item.certificateUrl && (
                    <TouchableOpacity
                      style={styles.downloadRow}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        router.push({ pathname: '/(application)/status', params: { id: item._id, showCert: '1' } });
                      }}
                    >
                      <Ionicons name="download-outline" size={14} color="#2563EB" />
                      <Text style={styles.downloadText}>Download Certificate</Text>
                    </TouchableOpacity>
                  )}

                  {/* Rejection inline note */}
                  {isRejected && item.rejectionReason && (
                    <Text style={styles.rejectionNote} numberOfLines={2}>
                      Reason: {item.rejectionReason}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#2563EB' },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  body: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: spacing.base,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    marginHorizontal: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },

  list: { padding: spacing.base, gap: spacing.sm, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 8 },
  statusBadge: { fontSize: 12, fontWeight: '800' },
  cardMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  downloadText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  rejectionNote: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: spacing.sm,
  },
});

