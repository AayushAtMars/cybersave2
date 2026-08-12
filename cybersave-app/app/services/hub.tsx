import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useServices } from '../../src/api/applications';
import { colors, spacing, radius, shadows } from '../../src/theme';

interface HubService {
  name: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}

export default function ServicesHubScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();

  // Fetch real services from DB for this category
  const dbCategoryQuery = (category === 'aadhaar' || category === 'pan' || category === 'certificate') ? category : 'gov_scheme';
  const { data, isLoading } = useServices(dbCategoryQuery);

  // Define details based on category
  let headerTitle = 'Government Services';
  let headerSub = 'Official Central Registry';
  let bannerText = 'Keep your documents updated. It is mandatory for availing central subsidy schemes.';
  let bannerIcon: keyof typeof Ionicons.glyphMap = 'information-circle-outline';
  let bannerBg = '#EFF6FF';
  let bannerTextColor = '#2563EB';

  if (category === 'aadhaar') {
    headerTitle = 'Aadhaar Services';
    headerSub = 'UIDAI Official Central Services';
    bannerText = 'Keep your Aadhaar details updated. It is mandatory for linking bank accounts, filing ITR, and availing subsidy schemes.';
    bannerIcon = 'information-circle-outline';
  } else if (category === 'pan') {
    headerTitle = 'PAN Card Services';
    headerSub = 'Income Tax Department';
    bannerText = 'Linking PAN with Aadhaar is mandatory. Unlinked PAN cards may become inoperative under Income Tax rules.';
    bannerIcon = 'warning-outline';
    bannerBg = '#FFFBEB';
    bannerTextColor = '#D97706';
  } else if (category === 'certificate') {
    headerTitle = 'Certificates';
    headerSub = 'State & Revenue Departments';
    bannerText = 'Apply for official state and central registry certificates with quick processing and low fee.';
    bannerIcon = 'ribbon-outline';
  } else if (category === 'banking') {
    headerTitle = 'Banking Services (AEPS)';
    headerSub = 'NPCI Aadhaar Enabled Payments';
    bannerText = 'Access basic banking services securely using your Aadhaar credentials and biometric verifications.';
    bannerIcon = 'wallet-outline';
  } else if (category === 'insurance') {
    headerTitle = 'Subsidized Insurance';
    headerSub = 'Government Insurance Schemes';
    bannerText = 'Enroll in subsidized accident and life insurance covers. Premium auto-debited securely.';
    bannerIcon = 'umbrella-outline';
  } else if (category === 'education') {
    headerTitle = 'Scholarships & Education';
    headerSub = 'Ministry of Education';
    bannerText = 'Apply for pre-matric, post-matric, and central sector scholarship benefits.';
    bannerIcon = 'book-outline';
  } else if (category === 'pension') {
    headerTitle = 'Pension Schemes';
    headerSub = 'PFRDA Old Age Pension';
    bannerText = 'Secure your retirement with monthly government pension programs.';
    bannerIcon = 'people-outline';
  } else if (category === 'employment') {
    headerTitle = 'Employment Services';
    headerSub = 'Labour & Rural Employment';
    bannerText = 'Register for Shramik cards or rural employment guarantee programs (NREGA).';
    bannerIcon = 'briefcase-outline';
  } else if (category === 'tax') {
    headerTitle = 'Taxation Services';
    headerSub = 'Income Tax & GST Portals';
    bannerText = 'File annual income tax returns or register businesses for GSTIN taxation.';
    bannerIcon = 'trending-up-outline';
  } else if (category === 'utility') {
    headerTitle = 'Utility Bills';
    headerSub = 'State & Central Utilities';
    bannerText = 'Pay electricity, water, and gas bills securely and instantly.';
    bannerIcon = 'flash-outline';
  } else if (category === 'agriculture') {
    headerTitle = 'Agriculture Schemes';
    headerSub = 'Department of Agriculture';
    bannerText = 'Avail PM-Kisan Samman Nidhi and other direct agricultural benefits.';
    bannerIcon = 'leaf-outline';
  } else if (category === 'health') {
    headerTitle = 'Health Services';
    headerSub = 'National Health Authority';
    bannerText = 'Register for Ayushman Bharat PM-JAY and health policies.';
    bannerIcon = 'heart-outline';
  }

  // Pre-configured mockup lists
  const mockAadhaar: HubService[] = [
    { name: 'Update Address', sub: 'Change online with valid proof of address', icon: 'home-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'Update Mobile', sub: 'Link your active number with bio verification', icon: 'call-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
    { name: 'Update Name', sub: 'Correct name spelling errors securely', icon: 'person-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
    { name: 'Download e-Aadhaar', sub: 'Get a secure digitally signed copy', icon: 'download-outline', iconBg: '#F5F3FF', iconColor: '#7C3AED' },
    { name: 'Check Status', sub: 'Track biometric or demographic updates', icon: 'time-outline', iconBg: '#FDF2F8', iconColor: '#EC4899' },
    { name: 'Book Appointment', sub: 'Reserve slot at closest Seva Kendra', icon: 'calendar-outline', iconBg: '#ECFEFF', iconColor: '#06B6D4' },
    { name: 'Verify Aadhaar', sub: 'Validate any Aadhaar number online', icon: 'shield-outline', iconBg: '#F0FDF4', iconColor: '#10B981' },
    { name: 'Link Bank Account', sub: 'Check status of NPCI mapping', icon: 'link-outline', iconBg: '#EFF6FF', iconColor: '#3B82F6' },
  ];

  const mockPan: HubService[] = [
    { name: 'Apply New PAN', sub: 'Issue fresh PAN card for individual or business', icon: 'add-circle-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'Corrections', sub: 'Modify name, DOB or signature details', icon: 'create-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
    { name: 'Reprint PAN', sub: 'Order physical card replacement easily', icon: 'copy-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
    { name: 'Link with Aadhaar', sub: 'Mandatory pairing for active validity', icon: 'link-outline', iconBg: '#FDF2F8', iconColor: '#DB2777' },
    { name: 'PAN Status', sub: 'Track processing of your application', icon: 'eye-outline', iconBg: '#F5F3FF', iconColor: '#7C3AED' },
    { name: 'e-PAN Download', sub: 'Secure instant digital copy download', icon: 'document-text-outline', iconBg: '#FEF2F2', iconColor: '#DC2626' },
    { name: 'PAN Verification', sub: 'Verify credentials of any PAN holder', icon: 'shield-checkmark-outline', iconBg: '#F0FDF4', iconColor: '#16A34A' },
    { name: 'TAN Application', sub: 'Tax Deduction Account registration', icon: 'briefcase-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
  ];

  const mockCertificate: HubService[] = [
    { name: 'Birth Certificate', sub: 'Processing: 5-7 days • Est Fee: Rs 50', icon: 'happy-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'Death Certificate', sub: 'Processing: 5-7 days • Est Fee: Rs 50', icon: 'heart-dislike-outline', iconBg: '#F8FAFC', iconColor: '#64748B' },
    { name: 'Marriage Certificate', sub: 'Processing: 10-15 days • Est Fee: Rs 100', icon: 'heart-outline', iconBg: '#FFF1F2', iconColor: '#E11D48' },
    { name: 'Income Certificate', sub: 'Processing: 7-10 days • Est Fee: Rs 30', icon: 'trending-up-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
    { name: 'Caste Certificate', sub: 'Processing: 10-12 days • Est Fee: Rs 40', icon: 'people-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
    { name: 'Domicile Certificate', sub: 'Processing: 7-10 days • Est Fee: Rs 30', icon: 'location-outline', iconBg: '#ECFEFF', iconColor: '#0891B2' },
    { name: 'Character Certificate', sub: 'Processing: 15 days • Est Fee: Rs 100', icon: 'shield-outline', iconBg: '#F5F3FF', iconColor: '#7C3AED' },
    { name: 'Residence Certificate', sub: 'Processing: 7 days • Est Fee: Rs 30', icon: 'compass-outline', iconBg: '#FDF2F8', iconColor: '#DB2777' },
  ];

  const mockGovScheme: HubService[] = [
    { name: 'PM SVANidhi Scheme', sub: 'SLA: 5 days • Est Fee: Rs 10', icon: 'cart-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
    { name: 'Pradhan Mantri Awas Yojana', sub: 'SLA: 10 days • Est Fee: Rs 15', icon: 'home-outline', iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  ];

  const mockUtility: HubService[] = [
    { name: 'Electricity Bill', sub: 'SLA: 24h • Est Fee: Rs 15', icon: 'flash-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
  ];

  const mockAgriculture: HubService[] = [
    { name: 'PM-Kisan Samman Nidhi', sub: 'SLA: 10 days • Est Fee: Rs 10', icon: 'leaf-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
  ];

  const mockHealth: HubService[] = [
    { name: 'Ayushman Bharat PM-JAY', sub: 'SLA: 3 days • Est Fee: Rs 10', icon: 'pulse-outline', iconBg: '#FFF1F2', iconColor: '#E11D48' },
  ];

  const mockBanking: HubService[] = [
    { name: 'AEPS Cash Withdrawal', sub: 'Withdraw cash securely via biometrics', icon: 'cash-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'Balance Inquiry', sub: 'Check real-time account ledger balance', icon: 'wallet-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
    { name: 'Mini Statement', sub: 'View details of your last 5 transactions', icon: 'receipt-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
  ];

  const mockInsurance: HubService[] = [
    { name: 'PMSBY — Accident Insurance', sub: '₹2 Lakh accident cover at ₹20/year', icon: 'shield-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'PMJJBY — Life Insurance', sub: '₹2 Lakh life cover at ₹436/year', icon: 'heart-outline', iconBg: '#FFF1F2', iconColor: '#E11D48' },
  ];

  const mockEducation: HubService[] = [
    { name: 'National Scholarship Scheme', sub: 'Financial aid for minority students', icon: 'school-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'Central Sector Scholarship', sub: 'Assistance for college students', icon: 'book-outline', iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  ];

  const mockPension: HubService[] = [
    { name: 'Atal Pension Yojana', sub: 'Subsidized pension after age 60', icon: 'people-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'IGNOAPS Old Age Pension', sub: 'Monthly aid for senior citizens', icon: 'heart-outline', iconBg: '#FFFBEB', iconColor: '#D97706' },
  ];

  const mockEmployment: HubService[] = [
    { name: 'Shramik Card Registration', sub: 'Register for labour welfare schemes', icon: 'construct-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'NREGA Job Card', sub: 'Guaranteed 100 days of rural work', icon: 'briefcase-outline', iconBg: '#F0F9FF', iconColor: '#0284C7' },
  ];

  const mockTax: HubService[] = [
    { name: 'ITR Filing (Salary Class)', sub: 'File annual returns (ITR-1) online', icon: 'analytics-outline', iconBg: '#EFF6FF', iconColor: '#2563EB' },
    { name: 'GST Registration', sub: 'Acquire new business GSTIN number', icon: 'business-outline', iconBg: '#ECFDF5', iconColor: '#059669' },
  ];

  // Match current hub selection
  let currentList = mockGovScheme;
  if (category === 'aadhaar') currentList = mockAadhaar;
  else if (category === 'pan') currentList = mockPan;
  else if (category === 'certificate') currentList = mockCertificate;
  else if (category === 'banking') currentList = mockBanking;
  else if (category === 'insurance') currentList = mockInsurance;
  else if (category === 'education') currentList = mockEducation;
  else if (category === 'pension') currentList = mockPension;
  else if (category === 'employment') currentList = mockEmployment;
  else if (category === 'tax') currentList = mockTax;
  else if (category === 'utility') currentList = mockUtility;
  else if (category === 'agriculture') currentList = mockAgriculture;
  else if (category === 'health') currentList = mockHealth;

  const handlePressOption = (option: HubService) => {
    // Check if the service exists in database
    const dbSvc = (data?.items ?? []).find((s) => {
      const db = s.name.toLowerCase();
      const opt = option.name.toLowerCase();
      if (db.includes(opt) || opt.includes(db)) return true;
      if (opt === 'update address' && db.includes('address') && db.includes('aadhaar')) return true;
      if (opt === 'apply new pan' && db.includes('pan') && db.includes('new')) return true;
      return false;
    });

    if (dbSvc) {
      router.push({
        pathname: '/services/detail',
        params: { serviceId: dbSvc._id },
      });
    } else {
      Alert.alert('Configuring Service', `${option.name} is currently offline for server migration. Please try Birth Certificate or PAN Card.`);
    }
  };

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
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{headerSub}</Text>
          </View>
          <TouchableOpacity style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Container */}
      <View style={styles.whiteContainer}>
        {/* Informative Banner */}
        <View style={[styles.infoBanner, { backgroundColor: bannerBg || '#EFF6FF' }]}>
          <Ionicons name={bannerIcon} size={20} color={bannerTextColor || '#2563EB'} />
          <Text style={[styles.infoBannerText, { color: bannerTextColor || '#2563EB' }]}>
            {bannerText}
          </Text>
        </View>

        <Text style={styles.sectionHeader}>Available Services</Text>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.grid}>
              {currentList.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => handlePressOption(item)}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.cardSub} numberOfLines={3}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
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
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
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
  headerTextGroup: {
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 27,
  },
  headerSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 2,
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -24,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: '#1E40AF',
  },
  sectionHeader: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    height: 138,
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    gap: 4,
    width: '100%',
  },
  cardName: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
  },
  cardSub: {
    fontFamily: 'System',
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    fontWeight: '400',
  },
});
