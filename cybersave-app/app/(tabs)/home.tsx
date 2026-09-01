import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useApplications, useServices } from '../../src/api/applications';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import { SkeletonScreen, NoInternet, SystemError } from '../../src/components/UIStates';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

// ── Custom SVG Icon component rendering files from assets/home ────────────────
const HomeSvgIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  switch (name) {
    case 'adhaar':
      return (
        <Svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none">
          <Path
            d="M 3.37574 17.9108 C 3.80241 16.7629 4.57004 15.7731 5.57554 15.0743 C 6.58105 14.3755 7.77627 14.0011 9.00072 14.0014 C 10.2252 14.0017 11.4202 14.3767 12.4253 15.0761 C 13.4305 15.7755 14.1976 16.7657 14.6236 17.9138 M 16.9984 12.0008 C 16.9984 17.001 13.4987 19.5011 9.33917 20.9511 C 9.12135 21.0249 8.88475 21.0214 8.66923 20.9411 C 4.49965 19.5011 1 17.001 1 12.0008 V 5.00058 C 1 4.73535 1.10535 4.48099 1.29286 4.29345 C 1.48038 4.10591 1.73471 4.00055 1.9999 4.00055 C 3.9997 4.00055 6.49945 2.80051 8.23928 1.28046 C 8.45111 1.09945 8.72058 1 8.9992 1 C 9.27782 1 9.54729 1.09945 9.75912 1.28046 C 11.5089 2.81051 13.9987 4.00055 15.9985 4.00055 C 16.2637 4.00055 16.518 4.10591 16.7055 4.29345 C 16.8931 4.48099 16.9984 4.73535 16.9984 5.00058 V 12.0008 Z M 12.9988 10.0003 C 12.9988 12.2095 11.2081 14.0004 8.9992 14.0004 C 6.79028 14.0004 4.9996 12.2095 4.9996 10.0003 C 4.9996 7.79108 6.79028 6.00016 8.9992 6.00016 C 11.2081 6.00016 12.9988 7.79108 12.9988 10.0003 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'banking':
      return (
        <Svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none">
          <Path
            d="M 8.9992 9.00064 H 9.0092 M 8.9992 13.001 H 9.0092 M 8.9992 5.00032 H 9.0092 M 12.9988 9.00064 H 13.0088 M 12.9988 13.001 H 13.0088 M 12.9988 5.00032 H 13.0088 M 4.9996 9.00064 H 5.0096 M 4.9996 13.001 H 5.0096 M 4.9996 5.00032 H 5.0096 M 5.9995 21.0016 V 18.0014 C 5.9995 17.7361 6.10485 17.4817 6.29236 17.2942 C 6.47988 17.1066 6.73421 17.0013 6.9994 17.0013 H 10.999 C 11.2642 17.0013 11.5185 17.1066 11.706 17.2942 C 11.8936 17.4817 11.9989 17.7361 11.9989 18.0014 V 21.0016 M 2.9998 1 H 14.9986 C 16.1031 1 16.9984 1.8955 16.9984 3.00016 V 19.0014 C 16.9984 20.1061 16.1031 21.0016 14.9986 21.0016 H 2.9998 C 1.89534 21.0016 1 20.1061 1 19.0014 V 3.00016 C 1 1.8955 1.89534 1 2.9998 1 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'certificates':
      return (
        <Svg width={size} height={size * (19 / 12)} viewBox="0 0 12 19" fill="none">
          <Path
            d="M 8.8977 10.0747 L 10.1602 17.1797 C 10.1743 17.2634 10.1626 17.3494 10.1266 17.4262 C 10.0905 17.503 10.0319 17.567 9.95848 17.6095 C 9.88509 17.6521 9.80045 17.6713 9.71587 17.6645 C 9.6313 17.6576 9.55082 17.6252 9.4852 17.5714 L 6.50187 15.3322 C 6.35785 15.2246 6.18289 15.1665 6.00312 15.1665 C 5.82334 15.1665 5.64839 15.2246 5.50437 15.3322 L 2.51603 17.5705 C 2.45047 17.6242 2.37008 17.6567 2.28561 17.6635 C 2.20114 17.6703 2.11659 17.6512 2.04325 17.6088 C 1.96991 17.5663 1.91126 17.5025 1.87513 17.4258 C 1.839 17.3492 1.82711 17.2633 1.84103 17.1797 L 3.1027 10.0747 M 11 6 C 11 8.76142 8.76142 11 6 11 C 3.23858 11 1 8.76142 1 6 C 1 3.23858 3.23858 1 6 1 C 8.76142 1 11 3.23858 11 6 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'education':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <Path
            d="M 9.99806 5.83333 V 17.5 M 9.99806 5.83333 C 9.99806 4.94928 9.64684 4.10143 9.02167 3.47631 C 8.3965 2.85119 7.54859 2.5 6.66446 2.5 H 2.49746 C 2.27643 2.5 2.06445 2.5878 1.90816 2.74408 C 1.75187 2.90036 1.66406 3.11232 1.66406 3.33333 V 14.1667 C 1.66406 14.3877 1.75187 14.5996 1.90816 14.7559 C 2.06445 14.9122 2.27643 15 2.49746 15 H 7.49786 C 8.16096 15 8.79689 15.2634 9.26577 15.7322 C 9.73465 16.2011 9.99806 16.837 9.99806 17.5 M 9.99806 5.83333 C 9.99806 4.94928 10.3493 4.10143 10.9745 3.47631 C 11.5996 2.85119 12.4475 2.5 13.3317 2.5 H 17.4987 C 17.7197 2.5 17.9317 2.5878 18.088 2.74408 C 18.2443 2.90036 18.3321 3.11232 18.3321 3.33333 V 14.1667 C 18.3321 14.3877 18.2443 14.5996 18.088 14.7559 C 17.9317 14.9122 17.7197 15 17.4987 15 H 12.4983 C 11.8352 15 11.1992 15.2634 10.7304 15.7322 C 10.2615 16.2011 9.99806 16.837 9.99806 17.5"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'insurance':
      return (
        <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
          <Path
            d="M 9.33237 10.1674 V 16.0012 C 9.33237 16.4433 9.50797 16.8672 9.82052 17.1798 C 10.1331 17.4924 10.557 17.668 10.999 17.668 C 11.441 17.668 11.8649 17.4924 12.1775 17.1798 C 12.4901 16.8672 12.6656 16.4433 12.6656 16.0012 M 9.33237 1 V 2.6668 M 16.8258 10.1673 C 16.9553 10.1683 17.0833 10.1392 17.1996 10.0822 C 17.3158 10.0252 17.4172 9.94181 17.4957 9.83876 C 17.5742 9.7357 17.6275 9.61577 17.6515 9.48849 C 17.6756 9.36122 17.6696 9.23009 17.6341 9.10552 C 17.1615 7.26277 16.0892 5.62966 14.5863 4.46348 C 13.0834 3.29731 11.2352 2.66436 9.333 2.66436 C 7.43077 2.66436 5.58261 3.29731 4.07969 4.46348 C 2.57677 5.62966 1.50453 7.26277 1.03189 9.10552 C 0.996579 9.22948 0.990496 9.35994 1.01412 9.48664 C 1.03775 9.61335 1.09043 9.73285 1.16805 9.83575 C 1.24566 9.93865 1.34607 10.0221 1.4614 10.0797 C 1.57673 10.1372 1.70383 10.1672 1.83271 10.1673 H 16.8258 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'pancard':
      return (
        <Svg width={size} height={size * (16 / 22)} viewBox="0 0 22 16" fill="none">
          <Path
            d="M 1 6.00057 H 21.0016 M 3.00016 1 H 19.0014 C 20.1061 1 21.0016 1.89553 21.0016 3.00023 V 13.0014 C 21.0016 14.1061 20.1061 15.0016 19.0014 15.0016 H 3.00016 C 1.8955 15.0016 1 14.1061 1 13.0014 V 3.00023 C 1 1.89553 1.8955 1 3.00016 1 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'paybills':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M 12.9991 15.9969 H 7.9996 M 13.999 7.99698 H 7.9996 M 15.9988 11.9969 H 7.9996 M 4 2.99673 C 4 2.73151 4.10535 2.47716 4.29286 2.28963C 4.48038 2.1021 4.73471 1.99674 4.9999 1.99674 C 5.24749 1.99538 5.49033 2.06477 5.69983 2.19674 L 6.63274 2.79673 C 6.84175 2.9303 7.08462 3.00128 7.33267 3.00128 C 7.58071 3.00128 7.82358 2.9303 8.0326 2.79673 L 8.9665 2.19674 C 9.17552 2.06316 9.41839 1.99219 9.66643 1.99219 C 9.91448 1.99219 10.1573 2.06316 10.3664 2.19674 L 11.2993 2.79673 C 11.5083 2.9303 11.7512 3.00128 11.9992 3.00128 C 12.2472 3.00128 12.4901 2.9303 12.6991 2.79673 L 13.632 2.19674 C 13.8411 2.06316 14.0839 1.99219 14.332 1.99219 C 14.58 1.99219 14.8229 2.06316 15.0319 2.19674 L 15.9658 2.79673 C 16.1748 2.9303 16.4177 3.00128 16.6657 3.00128 C 16.9138 3.00128 17.1566 2.9303 17.3657 2.79673 L 18.2986 2.19674 C 18.5081 2.06477 18.7509 1.99538 18.9985 1.99674 C 19.2637 1.99674 19.518 2.1021 19.7055 2.28963 C 19.8931 2.47716 19.9984 2.73151 19.9984 2.99673 V 20.9964 C 19.9984 21.2617 19.8931 21.516 19.7055 21.7035 C 19.518 21.8911 19.2637 21.9964 18.9985 21.9964 C 18.7509 21.9978 18.5081 21.9284 18.2986 21.7964 L 17.3657 21.1964 C 17.1566 21.0629 16.9138 20.9919 16.6657 20.9919 C 16.4177 20.9919 16.1748 21.0629 15.9658 21.1964 L 15.0319 21.7964 C 14.8229 21.93 14.58 22.001 14.332 22.001 C 14.0839 22.001 13.8411 21.93 13.632 21.7964 L 12.6991 21.1964 C 12.4901 21.0629 12.2472 20.9919 11.9992 20.9919 C 11.7512 20.9919 11.5083 21.0629 11.2993 21.1964 L 10.3664 21.7964 C 10.1573 21.93 9.91448 22.001 9.66643 22.001 C 9.41839 22.001 9.17552 21.93 8.9665 21.7964 L 8.0326 21.1964 C 7.82358 21.0629 7.58071 20.9919 7.33267 20.9919 C 7.08462 20.9919 6.84175 21.0629 6.63274 21.1964 L 5.69983 21.7964 C 5.49033 21.9284 5.24749 21.9978 4.9999 21.9964 C 4.73471 21.9964 4.48038 21.8911 4.29286 21.7035 C 4.10535 21.516 4 21.2617 4 20.9964 V 2.99673 Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    default:
      return null;
  }
};

// ── Complete list of all Service Categories ───────────────────────────────────
const CATEGORIES_LIST = [
  { key: 'certificate', label: 'Certificates', iconName: 'certificates', color: '#0F172A', bgColor: '#EFF6FF', fallbackIcon: 'award-outline' },
  { key: 'insurance', label: 'Insurance', iconName: 'insurance', color: '#0F172A', bgColor: '#ECFDF5', fallbackIcon: 'umbrella-outline' },
  { key: 'education', label: 'Education', iconName: 'education', color: '#0F172A', bgColor: '#F5F3FF', fallbackIcon: 'book-outline' },
  { key: 'aadhaar', label: 'Aadhaar', iconName: 'adhaar', color: '#2563EB', bgColor: '#EFF6FF', fallbackIcon: 'shield-checkmark-outline' },
  { key: 'pan', label: 'PAN Card', iconName: 'pancard', color: '#10B981', bgColor: '#ECFDF5', fallbackIcon: 'card-outline' },
  { key: 'gov_scheme', label: 'Schemes', iconName: 'banking', color: '#EF4444', bgColor: '#FEF2F2', fallbackIcon: 'business-outline' },
];

export default function HomeScreen() {
    const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  React.useEffect(() => {
    apiClient.patch('/auth/profile', {})
      .then((r) => {
        if (r.data?.data?.user) {
          updateUser(r.data.data.user);
        }
      })
      .catch((e) => console.log('Error fetching user profile in HomeScreen:', e));
  }, []);

  const { data: appData, isLoading: isAppLoading, isError: isAppError, refetch: refetchApps } = useApplications();
  const { data: servicesData, isLoading: isServicesLoading, isError: isServicesError, refetch: refetchServices } = useServices();
  const { isConnected } = useNetworkStatus();

  const handleRefresh = async () => {
    await Promise.all([refetchApps(), refetchServices()]);
  };

  const isLoading = isAppLoading || isServicesLoading;
  const isError = isAppError || isServicesError;

  // ── State guards ──────────────────────────────────────────────────────────────
  if (isConnected === false) return <NoInternet onRetry={handleRefresh} />;
  if (isLoading) return <SkeletonScreen />;
  if (isError) return (
    <SystemError
      errorCode="ERR_FETCH_HOME"
      onRetry={handleRefresh}
      onHome={() => {}}
    />
  );

  // Find real seeded services dynamically
  const pmKisanService = servicesData?.items?.find((s) => s.name.includes('PM-Kisan'));
  const electricityService = servicesData?.items?.find((s) => s.name.includes('Electricity'));

  const locationText =
    user?.district && user?.state
      ? `${user.district}, ${user.state}`
      : 'New Delhi, India';

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <View style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
        style={styles.scrollView}
      >
        {/* ── Header gradient ───────────────────────────────────────────── */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
                </Text>
              </View>
              <View>
                <Text style={styles.greeting}>{t('home.good')} {getTimeOfDay()}, {user?.name?.split(' ')[0] ?? 'there'}</Text>
                <Text style={styles.userLocation}>{locationText}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Curved white body container ────────────────────────────────── */}
        <View style={styles.whiteContainer}>
          {/* Search bar input representation */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/services')}
          >
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>{t('home.search_services')}</Text>
          </TouchableOpacity>

          {/* ── Quick Actions Card ───────────────────────────────────────── */}
          <LinearGradient
            colors={['#1E3A8A', '#2563EB']}
            style={styles.quickActionsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.quickActionsTitle}>{t('home.quick_actions')}</Text>
            <View style={styles.quickActionsGrid}>
              {/* Aadhaar */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/services', params: { category: 'aadhaar' } })
                }
                activeOpacity={0.8}
              >
                <View style={styles.actionCircle}>
                  <HomeSvgIcon name="adhaar" color="#2563EB" size={22} />
                </View>
                <Text style={styles.actionLabel}>{t('home.aadhaar')}</Text>
              </TouchableOpacity>

              {/* PAN Card */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/services', params: { category: 'pan' } })
                }
                activeOpacity={0.8}
              >
                <View style={styles.actionCircle}>
                  <HomeSvgIcon name="pancard" color="#10B981" size={22} />
                </View>
                <Text style={styles.actionLabel}>{t('home.pan_card')}</Text>
              </TouchableOpacity>

              {/* Pay Bills */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  if (electricityService) {
                    router.push({
                      pathname: '/services/detail',
                      params: { serviceId: electricityService._id },
                    });
                  } else {
                    router.push('/(tabs)/services');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionCircle}>
                  <HomeSvgIcon name="paybills" color="#F59E0B" size={22} />
                </View>
                <Text style={styles.actionLabel}>{t('home.pay_bills')}</Text>
              </TouchableOpacity>

              {/* Banking */}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(tabs)/services')}
                activeOpacity={0.8}
              >
                <View style={styles.actionCircle}>
                  <HomeSvgIcon name="banking" color="#EF4444" size={22} />
                </View>
                <Text style={styles.actionLabel}>{t('home.banking')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── Service Categories ─────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.service_categories')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
              <Text style={styles.viewAll}>{t('home.view_all')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {CATEGORIES_LIST.map((cat) => {
              const svgIcon = HomeSvgIcon({ name: cat.iconName, color: cat.color, size: 20 });
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={styles.categoryCard}
                  onPress={() => {
                    if (cat.key === 'gov_scheme') {
                      router.push('/schemes');
                    } else {
                      router.push({ pathname: '/(tabs)/services', params: { category: cat.key } });
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.categoryIconBg, { backgroundColor: cat.bgColor }]}>
                    {svgIcon ? svgIcon : <Ionicons name={cat.fallbackIcon as any} size={20} color={cat.color} />}
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Popular Services ───────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.popular_services')}</Text>
          </View>
          <TouchableOpacity
            style={styles.popularCard}
            onPress={() => {
            if (electricityService) {
                router.push({
                  pathname: '/services/detail',
                  params: { serviceId: electricityService._id },
                });
              } else {
                router.push('/(tabs)/services');
              }
            }}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.popularCardTitle}>{t('home.electricity_bill')}</Text>
              <Text style={styles.popularCardSub}>{t('home.pay_central_state_utility_bill')}</Text>
            </View>
          </TouchableOpacity>

          {/* ── PM-Kisan Samman Nidhi Banner ───────────────────────────────── */}
          <LinearGradient
            colors={['#1E3A8A', '#2563EB']}
            style={styles.schemeCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.schemeBadge}>
              <Text style={styles.schemeBadgeText}>{t('home.new_scheme')}</Text>
            </View>
            <Text style={styles.schemeTitle}>{t('home.pm_kisan_samman_nidhi')}</Text>
            <Text style={styles.schemeDesc}>
              
                                            {t('home.eligible_farmers_get_6_000_yea')}
                                          </Text>
            <TouchableOpacity
              onPress={() => {
                if (pmKisanService) {
                  router.push({
                    pathname: '/services/detail',
                    params: { serviceId: pmKisanService._id },
                  });
                } else {
                  router.push('/(tabs)/services');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.schemeLink}>{t('home.check_eligibility_gt')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
      {/* Floating AI Bot Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/bot')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        </LinearGradient>
       </TouchableOpacity>
      </View>
    </View>
  );
}

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1E3A8A' },
  scrollView: { backgroundColor: '#F5F7FA' },
  header: {
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.base,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userLocation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadows.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: 110,
    gap: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: typography.size.base,
    color: colors.textMuted,
  },
  quickActionsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.base,
    ...shadows.md,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAll: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  categoriesRow: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  categoryCard: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    width: 100,
    height: 110,
    ...shadows.sm,
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  popularCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  popularCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  popularCardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  schemeCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
    marginTop: spacing.xs,
  },
  schemeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  schemeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  schemeDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  schemeLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
});
