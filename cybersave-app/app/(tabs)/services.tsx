import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../src/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.base * 2 - spacing.md) / 2;

const FILTER_CHIPS = ['All', 'Popular', 'Government', 'Finance'];

interface HubCard {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  category: string;
  implemented: boolean;
}

const HUB_CARDS: HubCard[] = [
  { label: 'Aadhaar', icon: 'shield-outline', iconColor: '#2563EB', iconBg: '#EFF6FF', category: 'aadhaar', implemented: true },
  { label: 'PAN Card', icon: 'card-outline', iconColor: '#059669', iconBg: '#ECFDF5', category: 'pan', implemented: true },
  { label: 'Certificates', icon: 'ribbon-outline', iconColor: '#D97706', iconBg: '#FFFBEB', category: 'certificate', implemented: true },
  { label: 'Utility Bills', icon: 'document-text-outline', iconColor: '#DC2626', iconBg: '#FEF2F2', category: 'utility', implemented: true },
  { label: 'Banking (AEPS)', icon: 'business-outline', iconColor: '#7C3AED', iconBg: '#F5F3FF', category: 'banking', implemented: true },
  { label: 'Insurance', icon: 'umbrella-outline', iconColor: '#0891B2', iconBg: '#ECFEFF', category: 'insurance', implemented: true },
  { label: 'Education', icon: 'book-outline', iconColor: '#DB2777', iconBg: '#FDF2F8', category: 'education', implemented: true },
  { label: 'Agriculture', icon: 'leaf-outline', iconColor: '#16A34A', iconBg: '#F0FDF4', category: 'agriculture', implemented: true },
  { label: 'Health Services', icon: 'heart-outline', iconColor: '#E11D48', iconBg: '#FFF1F2', category: 'health', implemented: true },
  { label: 'Gov. Scheme', icon: 'library-outline', iconColor: '#0F172A', iconBg: '#F8FAFC', category: 'gov_scheme', implemented: true },
  { label: 'Pension Plan', icon: 'people-outline', iconColor: '#4F46E5', iconBg: '#EEF2FF', category: 'pension', implemented: true },
  { label: 'Employment', icon: 'briefcase-outline', iconColor: '#0284C7', iconBg: '#F0F9FF', category: 'employment', implemented: true },
  { label: 'Tax Services', icon: 'trending-up-outline', iconColor: '#1E293B', iconBg: '#F1F5F9', category: 'tax', implemented: true },
];

export default function ServicesScreen() {
  const [selectedChip, setSelectedChip] = useState('All');

  const handlePressCard = (card: HubCard) => {
    if (!card.implemented) {
      Alert.alert('Coming Soon', `${card.label} services are being configured and will be available soon.`);
      return;
    }
    router.push({
      pathname: '/services/hub',
      params: { category: card.category, hubName: card.label },
    });
  };

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
          <Text style={styles.headerTitle}>All Services</Text>
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
            {HUB_CARDS.map((card, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handlePressCard(card)}
              >
                <View style={[styles.iconBox, { backgroundColor: card.iconBg }]}>
                  <Ionicons name={card.icon} size={24} color={card.iconColor} />
                </View>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
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
    paddingTop: spacing.xs,
    alignItems: 'center',
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
    paddingTop: spacing.lg,
  },
  chipRow: {
    marginBottom: spacing.md,
  },
  chipScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 20,
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  gridContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: 110,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: COLUMN_WIDTH,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
});
