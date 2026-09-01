import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { shadows, spacing, radius } from '../../src/theme';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export default function AboutScreen() {
    const { t } = useTranslation();
  const handleItemPress = (label: string) => {
    Alert.alert(label, `${label} information will be opened.`);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about.about_cybersave')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Branding */}
        <View style={styles.brandingRow}>
          <Image
            source={require('../../assets/images/splash/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandingText}>
            <Text style={styles.appName}>{t('about.cybersave')}</Text>
            <Text style={styles.appVersion}>{t('about.version_2_1_0_build_54')}</Text>
          </View>
        </View>

        {/* Platform Description */}
        <Text style={styles.description}>
          
                            {t('about.csc_s_flagship_digital_governa')}
                          </Text>

        {/* Menu list card */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleItemPress('Terms of Service')}>
            <Text style={styles.menuItemLabel}>{t('about.terms_of_service')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleItemPress('Privacy Policy')}>
            <Text style={styles.menuItemLabel}>{t('about.privacy_policy')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleItemPress('Open Source Licenses')}>
            <Text style={styles.menuItemLabel}>{t('about.open_source_licenses')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastItem]} onPress={() => handleItemPress('Rate this App')}>
            <Text style={styles.menuItemLabel}>{t('about.rate_this_app')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Made in India badge */}
        <View style={styles.indiaBadge}>
          {/* Tricolour flag strips */}
          <View style={styles.flag}>
            <View style={[styles.flagStripe, { backgroundColor: '#FF9933' }]} />
            <View style={[styles.flagStripe, { backgroundColor: '#FFFFFF' }]} />
            <View style={[styles.flagStripe, { backgroundColor: '#138808' }]} />
          </View>
          <Text style={styles.indiaBadgeText}>{t('about.made_in_india')}</Text>
        </View>

        {/* Footer info */}
        <Text style={styles.footerLabel}>{t('about.developed_maintained_by')}</Text>
        <Text style={styles.footerValue}>{t('about.csc_e_governance_services_indi')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  content: {
    padding: spacing.base,
    gap: spacing.base,
    alignItems: 'center',
    paddingBottom: 40,
  },

  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.md,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandingText: {
    gap: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  appVersion: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '500',
    width: '100%',
    marginTop: spacing.xs,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    width: '100%',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  indiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    marginTop: spacing.md,
  },
  flag: {
    width: 22,
    height: 14,
    borderRadius: 2,
    overflow: 'hidden',
  },
  flagStripe: {
    flex: 1,
  },
  indiaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },

  footerLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  footerValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
});
