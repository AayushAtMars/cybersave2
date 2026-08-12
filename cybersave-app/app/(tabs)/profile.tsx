import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { logout } from '../../src/api/auth';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { Button } from '../../src/components/Button';


const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Personal Information', route: '/profile/info' as const },
  { icon: 'document-text-outline', label: 'Saved Documents', route: '/profile/documents' as const },
  { icon: 'location-outline', label: 'Addresses', route: '/profile/address' as const },
  { icon: 'globe-outline', label: 'Language', route: '/(onboarding)/language-select' as const }, // fallback route
  { icon: 'settings-outline', label: 'Settings', route: '/profile/settings' as const },
  { icon: 'shield-outline', label: 'Privacy & Security', route: '/profile/privacy' as const },
  { icon: 'help-circle-outline', label: 'Help & Support', route: '/support/tickets' as const },
  { icon: 'information-circle-outline', label: 'About Cybersave', route: '/profile/about' as const },
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
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

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
    setShowLogoutModal(true);
  };

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'RK';

  const formattedPhone = user?.phone
    ? (user.phone.startsWith('+') ? user.phone : `+91 ${user.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`)
    : '+91 98765 43210';

  const emailText = user?.email ?? 'rajesh.kumar@email.com';

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
              <Text style={styles.name} numberOfLines={1}>{user?.name ?? 'Rajesh Kumar'}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            {formattedPhone && (
              <Text style={styles.subText}>{formattedPhone}</Text>
            )}
            {emailText && (
              <Text style={styles.subText}>{emailText}</Text>
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
                <Ionicons name={item.icon as any} size={18} color="#2563EB" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Customized Bottom Sheet for Logout */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalDescription}>Are you sure you want to log out?</Text>
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              />
              <Button
                title="Logout"
                variant="destructive"
                style={styles.confirmBtn}
                onPress={() => {
                  setShowLogoutModal(false);
                  if (refreshToken) {
                    logout(refreshToken).catch(() => {});
                  }
                  clearAuth();
                  router.replace('/(onboarding)/splash');
                }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'center',
    marginTop: 8,
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { 
    fontFamily: 'Manrope',
    fontSize: 20, 
    fontWeight: '800', 
    color: '#FFFFFF' 
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: { 
    flex: 1, 
    gap: 4 
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: { 
    fontFamily: 'Manrope',
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  verifiedText: { 
    fontFamily: 'Inter',
    fontSize: 10, 
    color: '#10B981', 
    fontWeight: '700' 
  },
  subText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  menuSection: {
    gap: 8,
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  menuIcon: { 
    width: 18,
  },
  menuLabel: { 
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  logoutBtn: {
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: { 
    fontFamily: 'Inter',
    color: '#EF4444', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
