import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { logout } from '../../src/api/auth';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Personal Information', route: '/profile/info' as const, phase: 3 },
  { icon: 'document-text-outline', label: 'Saved Documents', route: '/profile/documents' as const, phase: 3 },
  { icon: 'location-outline', label: 'Addresses', route: '/profile/address' as const, phase: 3 },
  { icon: 'settings-outline', label: 'Settings', route: '/profile/settings' as const, phase: 3 },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', route: '/profile/privacy' as const, phase: 3 },
  { icon: 'chatbubble-ellipses-outline', label: 'Share Feedback', route: '/support/feedback' as const, phase: 3 },
  { icon: 'help-circle-outline', label: 'Help & Support', route: '/support/tickets' as const, phase: 6 },
  { icon: 'information-circle-outline', label: 'About Cybersave', route: '/profile/about' as const, phase: 3 },
];

const ADMIN_MENU = [
  { icon: 'grid-outline', label: 'Admin Dashboard', route: '/admin/dashboard' as const },
];

import { apiClient } from '../../src/api/client';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const updateUser = useAuthStore((s) => s.updateUser);

  React.useEffect(() => {
    apiClient.patch('/auth/profile', {})
      .then((r) => {
        if (r.data?.data?.user) {
          updateUser(r.data.data.user);
        }
      })
      .catch((e) => console.log('Error fetching user profile:', e));
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            if (refreshToken) await logout(refreshToken).catch(() => {});
            clearAuth();
            router.replace('/(onboarding)/splash');
          },
        },
      ]
    );
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  const formattedPhone = user?.phone
    ? (user.phone.startsWith('+') ? user.phone : `+91 ${user.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`)
    : null;

  const emailText = user?.email ?? null;

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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </LinearGradient>

      {/* Main Body */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card (Overlapping the gradient) */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'User'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            {formattedPhone ? (
              <Text style={styles.subText}>{formattedPhone}</Text>
            ) : (
              <Text style={[styles.subText, styles.missingText]}>Phone not added</Text>
            )}
            {emailText ? (
              <Text style={styles.subText}>{emailText}</Text>
            ) : (
              <Text style={[styles.subText, styles.missingText]}>Email not added</Text>
            )}
          </View>
        </View>

        {/* Admin Section — only visible to admin/super_admin */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionLabel}>Administration</Text>
            {ADMIN_MENU.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, { backgroundColor: '#1E3A8A' }]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={20} color="#FFFFFF" style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, { color: '#FFFFFF' }]}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu Cards */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => {
                if (item.route) {
                  router.push(item.route);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={20} color="#2563EB" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CyberSave v1.0.0 · Phase 1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
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
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    gap: spacing.base,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: { 
    flex: 1, 
    gap: 4 
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0F172A' 
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  verifiedText: { 
    fontSize: 10, 
    color: '#15803D', 
    fontWeight: '700' 
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  missingText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  menuSection: {
    gap: spacing.sm,
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md 
  },
  menuIcon: { 
    width: 24,
  },
  menuLabel: { 
    fontSize: 14, 
    color: '#334155',
    fontWeight: '600'
  },
  logoutBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFE4E6',
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...shadows.sm,
  },
  logoutText: { 
    color: '#E11D48', 
    fontSize: 15, 
    fontWeight: '700' 
  },
  version: { 
    textAlign: 'center', 
    color: '#94A3B8', 
    fontSize: 12, 
    marginTop: spacing.sm,
  },
});
