import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationsRead } from '../src/api/notifications';
import { colors, typography, spacing, radius, shadows } from '../src/theme';
import { EmptyNotifications, SkeletonScreen, NoInternet, SystemError } from '../src/components/UIStates';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

const fmtTimeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'updates' | 'payments'>('all');
  const qc = useQueryClient();
  const seenIds = useRef<Set<string>>(new Set());

  // Fetch real notifications with 5-second polling interval
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 5000,
  });

  const { isConnected } = useNetworkStatus();

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Unread notifications are loaded from the database directly, no local push trigger on screen load

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    if (unreadIds.length > 0) {
      markReadMutation.mutate(unreadIds);
    }
  };

  // Filter notifications based on segments
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'alerts') return item.type === 'system' || item.type === 'support';
    if (activeTab === 'updates') return item.type === 'application_update';
    if (activeTab === 'payments') return item.type === 'payment';
    return true;
  });

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'application_update':
        return { name: 'shield-checkmark-outline', color: '#10B981', bg: '#ECFDF5' };
      case 'payment':
        return { name: 'receipt-outline', color: '#3B82F6', bg: '#EFF6FF' };
      case 'system':
      case 'support':
      default:
        return { name: 'cog-outline', color: '#F59E0B', bg: '#FFFBEB' };
    }
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      {/* ── Header ────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <View style={styles.whiteContainer}>
        {/* Segmented control tabs */}
        <View style={styles.segmentContainer}>
          {(['all', 'alerts', 'updates', 'payments'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* No internet */}
        {isConnected === false ? (
          <NoInternet onRetry={() => refetch()} />
        ) : isLoading ? (
          <SkeletonScreen />
        ) : isError ? (
          <SystemError
            errorCode="ERR_FETCH_NOTIFICATIONS"
            onRetry={() => refetch()}
            onHome={() => router.replace('/(tabs)/home')}
            hideHeader={true}
          />
        ) : filteredNotifications.length === 0 ? (
          <EmptyNotifications onBack={() => router.replace('/(tabs)/home')} />
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const icon = getIconConfig(item.type);
              return (
                <View style={[styles.notifCard, !item.read && styles.unreadCard]}>
                  <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.timeAgo}>{fmtTimeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.notifBody}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.base,
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
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: spacing.md,
  },
  markRead: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#0F172A',
  },
  listContent: {
    paddingBottom: 40,
    gap: spacing.sm,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  unreadCard: {
    borderColor: '#EFF6FF',
    backgroundColor: '#F8FAFC',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  timeAgo: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: spacing.sm,
  },
  notifBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
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
});
