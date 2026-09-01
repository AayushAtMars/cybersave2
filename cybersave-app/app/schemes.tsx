import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../src/api/applications';
import { colors, typography, spacing, radius, shadows } from '../src/theme';
import { useTranslation } from "react-i18next";

interface Scheme {
  id: string;
  name: string;
  department: string;
  description: string;
  category: 'agriculture' | 'education' | 'health' | 'other';
  badgeText: string;
  badgeColors: { bg: string; text: string };
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'education', label: 'Education' },
  { key: 'health', label: 'Health' },
];

export default function SchemesScreen() {
    const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch all schemes dynamically from the backend
  const { data: servicesData, isLoading, refetch } = useServices('gov_scheme');

  // Helper to dynamically categorize and style backend services for high-fidelity UI representation
  const parseScheme = (service: any): Scheme => {
    const nameLower = service.name.toLowerCase();
    const deptLower = service.department.toLowerCase();

    let category: 'agriculture' | 'education' | 'health' | 'other' = 'other';
    let badgeText = 'All Indian Citizens';
    let badgeColors = { bg: '#EFF6FF', text: '#2563EB' }; // default Blue

    if (nameLower.includes('kisan') || nameLower.includes('agriculture') || nameLower.includes('farm') || deptLower.includes('agriculture')) {
      category = 'agriculture';
      badgeText = 'Eligible Farmers';
      badgeColors = { bg: '#ECFDF5', text: '#059669' }; // Green
    } else if (nameLower.includes('ayushman') || nameLower.includes('health') || nameLower.includes('jay') || deptLower.includes('health')) {
      category = 'health';
      badgeText = 'Below Poverty Line';
      badgeColors = { bg: '#FEE2E2', text: '#EF4444' }; // Red/Pink
    } else if (nameLower.includes('education') || nameLower.includes('school') || nameLower.includes('scholarship') || deptLower.includes('education')) {
      category = 'education';
      badgeText = 'Students';
      badgeColors = { bg: '#F5F3FF', text: '#7C3AED' }; // Purple
    } else if (nameLower.includes('svanidhi') || nameLower.includes('vendor') || nameLower.includes('self')) {
      category = 'other';
      badgeText = 'Self-Employed';
      badgeColors = { bg: '#FEF3C7', text: '#D97706' }; // Yellow/Orange
    } else if (nameLower.includes('electricity') || nameLower.includes('utility') || nameLower.includes('bill')) {
      category = 'other';
      badgeText = 'Utility Payees';
      badgeColors = { bg: '#F5F7FA', text: '#475569' }; // Grey
    }

    return {
      id: service._id,
      name: service.name,
      department: service.department,
      description: service.description || 'Government welfare initiative for eligible citizens.',
      category,
      badgeText,
      badgeColors,
    };
  };

  // Convert real DB services into UI-styled Scheme structures (skipping utility payments like Electricity Bill to keep it to official schemes)
  const dbSchemes = (servicesData?.items ?? [])
    .filter((s) => s.isActive && !s.name.toLowerCase().includes('electricity'))
    .map(parseScheme);

  // Filter schemes based on category and search query
  const filteredSchemes = dbSchemes.filter((scheme) => {
    const matchesCategory =
      selectedCategory === 'all' || scheme.category === selectedCategory;
    const matchesSearch =
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = (scheme: Scheme) => {
    // Navigate to the service detail screen first
    router.push({
      pathname: '/services/detail',
      params: { serviceId: scheme.id },
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('schemes.government_schemes')}</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Main Body */}
      <View style={styles.whiteContainer}>
        {/* Search Input */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search government schemes..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Chips */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.chip,
                  selectedCategory === c.key && styles.chipActive,
                ]}
                onPress={() => setSelectedCategory(c.key)}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    selectedCategory === c.key && styles.chipLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Schemes List */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={filteredSchemes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.schemeCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.schemeName}>{item.name}</Text>
                  <Text style={styles.schemeDept}>{item.department}</Text>
                </View>
                <Text style={styles.schemeDesc}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: item.badgeColors.bg },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: item.badgeColors.text }]}>
                      {item.badgeText}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleApply(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyBtnText}>{t('schemes.apply_now')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyTitle}>{t('schemes.no_schemes_found')}</Text>
                <Text style={styles.emptySub}>
                  
                                          {t('schemes.try_adjusting_your_search_term')}
                                        </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1E3A8A' },
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipLabel: {
    fontSize: typography.size.sm,
    color: '#64748B',
    fontWeight: typography.weight.medium,
  },
  chipLabelActive: {
    color: '#FFFFFF',
    fontWeight: typography.weight.semiBold,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: 40,
    gap: spacing.base,
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardHeader: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  schemeDept: {
    fontSize: 12,
    color: '#64748B',
  },
  schemeDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
});
