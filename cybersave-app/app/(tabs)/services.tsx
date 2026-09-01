import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../src/theme';

import { useServices } from '../../src/api/applications';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.base * 2 - spacing.md) / 2;

const FILTER_CHIPS = ['All', 'Popular', 'Government', 'Finance', 'Utility'];

interface HubCard {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  category: string;
  implemented: boolean;
  tags: string[];
  isCustomGovStyle?: boolean;
  iconUrl?: string;
  serviceId?: string;
  hasSubServices?: boolean;
}

const HUB_CARDS: HubCard[] = [
  {
    label: 'Aadhaar',
    icon: 'shield-checkmark-outline',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    category: 'aadhaar',
    implemented: true,
    tags: ['All', 'Popular', 'Government'],
  },
  {
    label: 'PAN Card',
    icon: 'card-outline',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    category: 'pan',
    implemented: true,
    tags: ['All', 'Popular', 'Government'],
  },
  {
    label: 'Certificates',
    icon: 'ribbon-outline',
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    category: 'certificate',
    implemented: true,
    tags: ['All', 'Government'],
  },
  {
    label: 'Utility Bills',
    icon: 'receipt-outline',
    iconColor: '#EF4444',
    iconBg: '#FEE2E2',
    category: 'utility',
    implemented: true,
    tags: ['All', 'Popular', 'Utility'],
  },
  {
    label: 'Banking (AEPS)',
    icon: 'business-outline',
    iconColor: '#D97706',
    iconBg: 'rgba(245, 158, 11, 0.1)',
    category: 'banking',
    implemented: true,
    tags: ['All', 'Popular', 'Finance'],
  },
  {
    label: 'Insurance',
    icon: 'umbrella-outline',
    iconColor: '#059669',
    iconBg: 'rgba(16, 185, 129, 0.1)',
    category: 'insurance',
    implemented: true,
    tags: ['All', 'Finance'],
  },
  {
    label: 'Education',
    icon: 'book-outline',
    iconColor: '#7C3AED',
    iconBg: 'rgba(139, 92, 246, 0.1)',
    category: 'education',
    implemented: true,
    tags: ['All'],
  },
  {
    label: 'Agriculture',
    icon: 'leaf-outline',
    iconColor: '#15803D',
    iconBg: 'rgba(16, 185, 129, 0.1)',
    category: 'agriculture',
    implemented: true,
    tags: ['All'],
  },
  {
    label: 'Health Services',
    icon: 'heart-outline',
    iconColor: '#DC2626',
    iconBg: 'rgba(239, 68, 68, 0.1)',
    category: 'health',
    implemented: true,
    tags: ['All'],
  },
  {
    label: 'Gov. Scheme',
    icon: 'library-outline',
    iconColor: '#2563EB',
    iconBg: '#FFFFFF',
    category: 'gov_scheme',
    implemented: true,
    tags: ['All', 'Popular', 'Government'],
    isCustomGovStyle: true,
  },
  {
    label: 'Pension Plan',
    icon: 'people-outline',
    iconColor: '#1D4ED8',
    iconBg: 'rgba(59, 130, 246, 0.1)',
    category: 'pension',
    implemented: true,
    tags: ['All', 'Government', 'Finance'],
  },
  {
    label: 'Employment',
    icon: 'briefcase-outline',
    iconColor: '#4F46E5',
    iconBg: 'rgba(99, 102, 241, 0.1)',
    category: 'employment',
    implemented: true,
    tags: ['All', 'Government'],
  },
  {
    label: 'Tax Services',
    icon: 'analytics-outline',
    iconColor: '#0F172A',
    iconBg: 'rgba(0, 0, 0, 0.04)',
    category: 'tax',
    implemented: true,
    tags: ['All', 'Finance'],
  },
];

export default function ServicesScreen() {
    const { t } = useTranslation();
  const [selectedChip, setSelectedChip] = useState('All');
  const { data } = useServices();

  // Filter out the pre-seeded sub-services to identify custom created main services
  const seededNames = [
    "update address", "update mobile", "update name", "download e-aadhaar", "check status", "book appointment", "verify aadhaar", "link bank account",
    "apply new pan", "corrections", "reprint pan", "link with aadhaar", "pan status", "e-pan download", "pan verification", "tan application",
    "birth certificate", "death certificate", "marriage certificate", "income certificate", "caste certificate", "domicile certificate", "character certificate", "residence certificate",
    "pm-kisan samman nidhi", "electricity bill", "pm svanidhi scheme", "ayushman bharat pm-jay", "pradhan mantri awas yojana",
    "aeps cash withdrawal", "balance inquiry", "mini statement", "pmsby — accident insurance", "pmjjby — life insurance",
    "national scholarship scheme", "central sector scholarship", "atal pension yojana", "ignoaps old age pension", "shramik card registration",
    "nregs job card", "nrega job card", "itr filing (salary class)", "gst registration"
  ];

  const customDbCards: HubCard[] = (data?.items ?? [])
    .filter(svc => {
      const nameLower = svc.name.toLowerCase();
      // It is a custom main service card if its name is not a seeded sub-service and it has sub-services or is marked active
      return !seededNames.includes(nameLower) && (svc.subServices && svc.subServices.length > 0 || svc.isActive);
    })
    .map(svc => ({
      label: svc.name,
      icon: 'library-outline',
      iconColor: '#7C3AED',
      iconBg: '#F5F3FF',
      category: svc.category || 'gov_scheme',
      implemented: true,
      tags: ['All', 'Government'],
      iconUrl: svc.iconUrl,
      serviceId: svc._id,
      hasSubServices: svc.subServices && svc.subServices.length > 0
    }));

  const finalCards = [...HUB_CARDS, ...customDbCards];

  const handlePressCard = (card: HubCard) => {
    if (!card.implemented) {
      Alert.alert('Coming Soon', `${card.label} services are being configured and will be available soon.`);
      return;
    }
    if (card.serviceId) {
      if (card.hasSubServices) {
        router.push({
          pathname: '/services/hub',
          params: { category: card.category, hubName: card.label, parentServiceId: card.serviceId },
        });
      } else {
        router.push({
          pathname: '/services/detail',
          params: { serviceId: card.serviceId },
        });
      }
      return;
    }
    router.push({
      pathname: '/services/hub',
      params: { category: card.category, hubName: card.label },
    });
  };

  const filteredCards = finalCards.filter((card) => card.tags.includes(selectedChip));

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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('services.all_services')}</Text>
          <View style={styles.placeholderWidth} />
        </View>
      </LinearGradient>

      {/* Main Container */}
      <View style={styles.whiteContainer}>
        {/* Category filter chips */}
        <View style={styles.chipRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {FILTER_CHIPS.map((chip) => {
              const isActive = selectedChip === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedChip(chip)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Grid Scroll */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
        >
          <View style={styles.grid}>
            {filteredCards.map((card, idx) => {
              const isCustomGov = card.isCustomGovStyle;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.card, isCustomGov && styles.customGovCard]}
                  activeOpacity={0.8}
                  onPress={() => handlePressCard(card)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: card.iconBg },
                      isCustomGov && styles.customGovIconBox,
                    ]}
                  >
                    {card.iconUrl ? (
                      <Image source={{ uri: card.iconUrl }} style={{ width: 24, height: 24, borderRadius: 6 }} resizeMode="contain" />
                    ) : (
                      <Ionicons name={card.icon} size={20} color={card.iconColor} />
                    )}
                  </View>
                  <Text style={styles.cardLabel}>{card.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingBottom: 48,
    paddingHorizontal: spacing.base,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholderWidth: {
    width: 40,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: -24,
    marginBottom: 14,
    paddingTop: spacing.md,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  chipScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 110, // Ensure scroll clearance for absolute floating tab bar
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '48%', // Robust percentage width for two columns
    height: 88,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customGovCard: {
    ...shadows.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customGovIconBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
  },
  cardLabel: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
});

