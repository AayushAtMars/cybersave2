/**
 * UIStates.tsx
 *
 * Standardized full-screen state components matching the 5 design mockups:
 *  - EmptyNotifications  (bell icon, "All Caught Up!")
 *  - EmptyApplications   (folder icon, "No Applications Yet")
 *  - SkeletonScreen      (shimmering skeleton matching home layout)
 *  - SystemError         (warning icon, "Something Went Wrong", Retry + Go to Home)
 *  - NoInternet          (wifi-off icon, "No Internet Connection", Try Again + Offline)
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { radius, spacing } from '../theme';

// ── Shimmer pulse animation used by skeleton ────────────────────────────────
const usePulse = () => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
};

// Skeleton bar primitive
const SBar: React.FC<{
  w?: number | string; h?: number; r?: number; mt?: number;
}> = ({ w = '100%', h = 14, r = 8, mt = 0 }) => {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{
        width: w as any,
        height: h,
        borderRadius: r,
        backgroundColor: '#E2E8F0',
        marginTop: mt,
        opacity,
      }}
    />
  );
};

// ── 1. Empty Notifications ────────────────────────────────────────────────────
export const EmptyNotifications: React.FC<{ onBack?: () => void }> = ({
  onBack,
}) => (
  <View style={styles.center}>
    <View style={styles.iconCircle}>
      <Ionicons name="notifications-outline" size={36} color="#2563EB" />
    </View>
    <Text style={styles.title}>All Caught Up!</Text>
    <Text style={styles.subtitle}>You have no new notifications.</Text>
    <TouchableOpacity
      style={styles.outlineBtn}
      onPress={onBack ?? (() => router.back())}
    >
      <Text style={styles.outlineBtnText}>Back to Home</Text>
    </TouchableOpacity>
  </View>
);

// ── 2. Empty Applications ─────────────────────────────────────────────────────
export const EmptyApplications: React.FC<{ onBrowse?: () => void; style?: any }> = ({
  onBrowse,
  style,
}) => (
  <View style={[styles.center, style]}>
    <View style={styles.iconCircle}>
      <Ionicons name="folder-open-outline" size={36} color="#2563EB" />
    </View>
    <Text style={styles.title}>No Applications Yet</Text>
    <Text style={styles.subtitle}>Start your first application to see it here.</Text>
    <TouchableOpacity
      style={styles.solidBtn}
      onPress={onBrowse ?? (() => router.push('/(tabs)/services'))}
    >
      <Text style={styles.solidBtnText}>Browse Services</Text>
    </TouchableOpacity>
  </View>
);

// ── 3. Skeleton Screen (matches home layout from mockup) ──────────────────────
export const SkeletonScreen: React.FC = () => (
  <ScrollView style={styles.skeletonBg} contentContainerStyle={styles.skeletonContent} scrollEnabled={false}>
    {/* Header area */}
    <View style={styles.skeletonHeader}>
      <View style={{ flex: 1, gap: 8 }}>
        <SBar w="40%" h={12} />
        <SBar w="65%" h={18} />
      </View>
      <SBar w={44} h={44} r={22} />
    </View>

    {/* Balance / main card */}
    <SBar w="100%" h={130} r={20} mt={12} />

    {/* Quick action row */}
    <View style={styles.skeletonRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonAction}>
          <SBar w={52} h={52} r={16} />
          <SBar w={44} h={10} r={6} mt={8} />
        </View>
      ))}
    </View>

    {/* Section label */}
    <SBar w="45%" h={14} r={8} mt={4} />

    {/* Service cards */}
    <View style={styles.skeletonRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SBar w={40} h={40} r={12} />
          <SBar w="80%" h={11} r={6} mt={10} />
          <SBar w="55%" h={9} r={6} mt={6} />
        </View>
      ))}
    </View>

    {/* List items */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonListItem}>
        <SBar w={44} h={44} r={12} />
        <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
          <SBar w="70%" h={14} />
          <SBar w="45%" h={10} />
        </View>
        <SBar w={60} h={22} r={11} />
      </View>
    ))}
  </ScrollView>
);

// ── 4. System Error ───────────────────────────────────────────────────────────
export const SystemError: React.FC<{
  errorCode?: string;
  onRetry?: () => void;
  onHome?: () => void;
  hideHeader?: boolean;
}> = ({ errorCode, onRetry, onHome, hideHeader = false }) => (
  <View style={styles.errorWrap}>
    {/* Header */}
    {!hideHeader && (
      <View style={styles.errorHeader}>
        <TouchableOpacity style={styles.errorBack} onPress={onHome ?? (() => router.back())}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.errorHeaderTitle}>System Error</Text>
        <View style={{ width: 36 }} />
      </View>
    )}

    <View style={styles.center}>
      {/* Warning icon in pink circle */}
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning-outline" size={36} color="#EF4444" />
      </View>
      <Text style={styles.title}>Something Went Wrong</Text>
      <Text style={styles.subtitle}>Please check your connection and try again.</Text>

      <TouchableOpacity
        style={styles.solidBtn}
        onPress={onRetry}
      >
        <Text style={styles.solidBtnText}>Retry</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onHome ?? (() => router.replace('/(tabs)/home'))}>
        <Text style={styles.linkText}>Go to Home</Text>
      </TouchableOpacity>

      {errorCode && (
        <Text style={styles.errorCode}>Error Code: {errorCode}</Text>
      )}
    </View>
  </View>
);

// ── 5. No Internet ────────────────────────────────────────────────────────────
export const NoInternet: React.FC<{
  onRetry?: () => void;
  onOffline?: () => void;
}> = ({ onRetry, onOffline }) => (
  <View style={styles.noNetWrap}>
    {/* Dashed blue border outline */}
    <View style={styles.noNetInner}>
      <Text style={styles.noNetHeaderTitle}>Connection Status</Text>

      <View style={[styles.center, { flex: 1 }]}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={36} color="#2563EB" />
        </View>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>Please check your WiFi or mobile data.</Text>

        <TouchableOpacity style={styles.solidBtn} onPress={onRetry}>
          <Text style={styles.solidBtnText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onOffline}
        >
          <Text style={styles.outlineBtnText}>Use Offline Features</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Shared
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  errorIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 22,           // rounded square for error (matches mockup)
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  solidBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  solidBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  outlineBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  outlineBtnText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },

  linkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 4,
  },

  errorCode: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
  },

  // Error screen
  errorWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  errorBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  // No internet screen
  noNetWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    paddingTop: 56,
  },
  noNetInner: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 20,
  },
  noNetHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    paddingBottom: 8,
  },

  // Skeleton
  skeletonBg: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  skeletonContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skeletonAction: {
    flex: 1,
    alignItems: 'center',
    gap: 0,
  },
  skeletonCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
});
