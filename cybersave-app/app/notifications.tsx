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
        return { name: 'shield-checkmark-outline', color: '#10B981' };
      case 'payment':
        return { name: 'receipt-outline', color: '#2563EB' };
      case 'system':
      case 'support':
      default:
        return { name: 'settings-outline', color: '#F59E0B' };
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
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
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
              const isUnread = !item.read;
              return (
                <View style={[styles.notifCard, isUnread ? styles.unreadCard : styles.readCard]}>
                  <View style={styles.iconBg}>
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
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  headerTitle: {
    flex: 1,
    fontFamily: 'Manrope',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  markRead: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
    marginHorizontal:20
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  segmentTextActive: {
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#0F172A',
  },
  listContent: {
    paddingBottom: 40,
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#EFF6FF',
    backgroundColor: '#FFFFFF',
  },
  readCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notifTitle: {
    fontFamily: 'Manrope',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  timeAgo: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
  },
  notifBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});

