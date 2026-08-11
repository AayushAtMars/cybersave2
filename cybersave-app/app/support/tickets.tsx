import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getTickets, Ticket } from '../../src/api/support';
import { colors, spacing, radius, shadows } from '../../src/theme';

const POPULAR_TOPICS = [
  {
    id: 'topic1',
    title: 'How to download digital driving license?',
    desc: 'To download your driving license: 1. Go to the Home tab and choose Driving License. 2. Verify your Aadhaar information. 3. Enter your License Number. 4. Tap "Retrieve Document" to fetch and verify it directly from the national registry database.',
  },
  {
    id: 'topic2',
    title: 'Aadhaar fingerprint authentication failed',
    desc: 'If Aadhaar biometric / fingerprint verification fails: 1. Ensure your fingers are clean and free of dust. 2. Verify that your local scanner is properly plugged in. 3. If using OTP authentication instead, check that your mobile number is linked in your profile or use the legacy sandboxed fallback keys.',
  },
  {
    id: 'topic3',
    title: 'Linking old PAN with active e-filing portal',
    desc: 'To link your PAN card details: 1. Navigate to the profile settings and enter your 10-digit PAN number. 2. Make sure the name on your PAN matches your Aadhaar profile database. 3. Tap "Link Account" to verify records directly with the Income Tax department.',
  },
  {
    id: 'topic4',
    title: 'Direct Benefits Transfer (DBT) issue report',
    desc: 'If your DBT payment status fails or is pending: 1. Go to your Wallet and review the transactions list. 2. Check if your Aadhaar status is linked to your bank account records. 3. If there is a missing transaction, open a Support Ticket pasting the transaction reference ID.',
  },
];

export default function SupportTicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedTopic, setSelectedTopic] = useState<{ title: string; desc: string } | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTickets = async () => {
    try {
      const items = await getTickets();
      setTickets(items);
    } catch (err) {
      console.warn('Failed to retrieve support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCallEmergency = () => {
    Linking.openURL('tel:112').catch(() => {
      Alert.alert('Calling Failed', 'Could not open phone dialer automatically. Please dial 112 manually.');
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Validation Error', 'Please write some feedback before submitting.');
      return;
    }
    setShowFeedbackModal(false);
    setFeedbackText('');
    setSuccessMsg('Thank you for sharing your feedback! We will use it to improve Cybersave.');
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 350);
  };

  const getStatusStyle = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return { bg: '#FEF2F2', text: '#DC2626' };
      case 'in_progress':
        return { bg: '#EFF6FF', text: '#2563EB' };
      case 'resolved':
      case 'closed':
        return { bg: '#F0FDF4', text: '#16A34A' };
    }
  };

  const filteredTopics = POPULAR_TOPICS.filter((topic) =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Main Body */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search help articles */}
        <View style={styles.searchBarRow}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Open Ticket Button */}
        <TouchableOpacity 
          style={styles.openTicketCard} 
          activeOpacity={0.8}
          onPress={() => setShowTicketsModal(true)}
        >
          <View style={styles.ticketIconOuter}>
            <Ionicons name="mail-outline" size={26} color="#EF4444" />
          </View>
          <Text style={styles.ticketCardTitle}>Open Ticket</Text>
          <Text style={styles.ticketCardSub}>Track issues</Text>
        </TouchableOpacity>

        {/* Popular Help Topics */}
        <Text style={styles.sectionHeader}>Popular Help Topics</Text>
        <View style={styles.topicsCard}>
          {filteredTopics.length === 0 ? (
            <Text style={styles.noResultsText}>No matching help topics found.</Text>
          ) : (
            filteredTopics.map((topic, index) => (
              <View key={topic.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity 
                  style={styles.topicRow} 
                  activeOpacity={0.7}
                  onPress={() => setSelectedTopic(topic)}
                >
                  <Text style={styles.topicText}>{topic.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* National Helpline Numbers */}
        <Text style={styles.sectionHeader}>National Helpline Numbers</Text>
        <TouchableOpacity 
          style={styles.emergencyCard} 
          activeOpacity={0.8}
          onPress={handleCallEmergency}
        >
          <View style={styles.emergencyIconBox}>
            <Ionicons name="call" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>National Emergency</Text>
            <Text style={styles.emergencySubtitle}>Single Emergency helpline response</Text>
          </View>
          <Text style={styles.emergencyNumber}>112</Text>
        </TouchableOpacity>

        {/* Share App Feedback Button */}
        <TouchableOpacity 
          style={styles.feedbackBtn} 
          activeOpacity={0.8}
          onPress={() => router.push('/support/feedback')}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#2563EB" />
          <Text style={styles.feedbackBtnText}>Share App Feedback</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ticket List Modal (Bottom Sheet style) */}
      <Modal
        visible={showTicketsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTicketsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowTicketsModal(false)} 
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.dragIndicator} />
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Active Support Tickets</Text>
                <TouchableOpacity onPress={() => setShowTicketsModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={tickets}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.ticketListContent}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="mail-unread-outline" size={44} color="#94A3B8" />
                    <Text style={styles.emptyText}>No tickets found</Text>
                    <Text style={styles.emptySub}>
                      Submit queries relating to payments or applications by tapping the button below.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const statusStyle = getStatusStyle(item.status);
                  return (
                    <TouchableOpacity
                      style={styles.ticketCard}
                      onPress={() => {
                        setShowTicketsModal(false);
                        router.push({ pathname: '/support/chat', params: { id: item._id } });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ticketHeader}>
                        <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle?.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle?.text }]}>
                            {item.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>
                      <Text style={styles.ticketTime}>
                        Updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Create New Ticket Action */}
            <TouchableOpacity 
              style={styles.createNewTicketBtn}
              onPress={() => {
                setShowTicketsModal(false);
                router.push('/support/create');
              }}
            >
              <Text style={styles.createNewTicketText}>+ Create New Ticket</Text>
            </TouchableOpacity>
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#FFFFFF' }} />
          </View>
        </View>
      </Modal>

      {/* Help Topic Details Modal */}
      <Modal
        visible={!!selectedTopic}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTopic(null)}
      >
        <View style={styles.topicOverlay}>
          <View style={styles.topicCard}>
            <View style={styles.topicHeaderRow}>
              <Text style={styles.topicHeaderTitle}>{selectedTopic?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedTopic(null)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.topicContentText}>{selectedTopic?.desc}</Text>
            <TouchableOpacity 
              style={styles.topicDismissBtn}
              onPress={() => setSelectedTopic(null)}
            >
              <Text style={styles.topicDismissText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback Form Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeaderRow}>
              <Text style={styles.feedbackHeaderTitle}>Share App Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.feedbackInput}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="What do you think about Cybersave? Tell us what you like or how we can improve..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity 
              style={styles.feedbackSubmitBtn}
              onPress={handleSubmitFeedback}
            >
              <Text style={styles.feedbackSubmitText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconOuter}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
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
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: spacing.base,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  openTicketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  ticketIconOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ticketCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  ticketCardSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: spacing.xs,
  },
  topicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  topicText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: spacing.md,
  },
  noResultsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  emergencyCard: {
    backgroundColor: '#FFE4E6',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  emergencyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyInfo: {
    flex: 1,
    gap: 2,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  emergencySubtitle: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
  },
  emergencyNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
  },
  feedbackBtn: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: '#EFF6FF',
    marginTop: spacing.xs,
  },
  feedbackBtnText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },

  // Modal styling (Bottom Sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBgDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
    ...shadows.lg,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  sheetHeader: {
    marginBottom: spacing.base,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  ticketListContent: {
    gap: spacing.base,
    paddingBottom: spacing.lg,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  ticketTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
  },
  createNewTicketBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  createNewTicketText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Topic Details Modal
  topicOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  topicHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  topicContentText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  topicDismissBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  topicDismissText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Feedback Overlay
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  feedbackInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    height: 100,
    textAlignVertical: 'top',
  },
  feedbackSubmitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xs,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
