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
import { useTranslation } from "react-i18next";

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
  submitted:    { label: 'Pending',     color: '#3B82F6', bg: '#EFF6FF' },
  under_review: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  docs_pending: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  processing:   { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  completed:    { label: 'Approved',    color: '#10B981', bg: '#DCFCE7' },
  rejected:     { label: 'Rejected',    color: '#EF4444', bg: '#FEE2E2' },
};

export default function ApplicationsScreen() {
    const { t } = useTranslation();
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
      <LinearGradient 
        colors={['#1E3A8A', '#2563EB']} 
        style={styles.header} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} />
        <Text style={styles.headerTitle}>{t('applications.my_applications')}</Text>
      </LinearGradient>

      {/* Curved White Body Card */}
      <View style={styles.body}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applications..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
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
                activeOpacity={0.8}
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
          <EmptyApplications onBrowse={() => router.push('/(tabs)/services')} style={{ marginTop: -60 }} />
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
                    {/* Left side: Icon + Title Group */}
                    <View style={styles.cardLeft}>
                      <View style={styles.cardIcon}>
                        <Ionicons name="document-text" size={20} color="#2563EB" />
                      </View>

                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.serviceName}</Text>
                        <Text style={styles.cardMeta}>
                          
                                                                {t('applications.id')} {item.applicationRefNo}  {t('applications.submitted')} {fmtDate(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Right side: Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>

                  {/* Download Certificate — shown for approved */}
                  {isApproved && (
                    <TouchableOpacity
                      style={styles.downloadRow}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        router.push({ pathname: '/(application)/status', params: { id: item._id, showCert: '1' } });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.downloadText}>{t('applications.download_certificate')}</Text>
                      <Ionicons name="download" size={14} color="#2563EB" />
                    </TouchableOpacity>
                  )}

                  {/* Rejection inline note */}
                  {isRejected && item.rejectionReason && (
                    <Text style={styles.rejectionNote} numberOfLines={2}>
                      
                                                    {t('applications.reason')} {item.rejectionReason}
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
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: 48,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    fontFamily: 'System',
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: -32,
    paddingTop: 20,
    paddingBottom: 0,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 42,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'System',
  },

  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#64748B',
    fontFamily: 'System',
  },
  pillTextActive: { 
    color: '#FFFFFF',
    fontWeight: '700',
  },

  list: { 
    paddingHorizontal: 20, 
    gap: 12, 
    paddingBottom: 100,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { 
    marginLeft: 12,
    flex: 1,
    gap: 2,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0F172A',
    fontFamily: 'System',
  },
  cardMeta: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '400',
    fontFamily: 'System',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'System',
  },

  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  downloadText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#2563EB',
    fontFamily: 'System',
  },

  rejectionNote: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: 12,
  },
});

