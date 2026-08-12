/**
 * Application Status / Detail screen
 * Routes to appropriate sub-view based on app.status:
 *   rejected     → Rejection detail view (screen-applications-rejected-detail)
 *   completed    → Application details + Download certificate (screen-applications-details + screen-applications-download)
 *   in-progress  → Timeline view (screen-applications-in-progress)
 *   default      → Pending detail view (screen-applications-details)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useApplication } from '../../src/api/applications';
import { shadows, spacing, radius } from '../../src/theme';

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hr = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  hr = hr ? hr : 12;
  return `${day} ${month} ${year}, ${String(hr).padStart(2, '0')}:${min} ${ampm}`;
};

// ── Timeline step definitions ──────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: 'submitted',    label: 'Application Submitted' },
  { key: 'under_review', label: 'Document Verification' },
  { key: 'processing',   label: 'Under Processing' },
  { key: 'approved',     label: 'Official Approval' },
  { key: 'completed',    label: 'Certificate Generated' },
];

const STATUS_ORDER = ['draft', 'submitted', 'under_review', 'docs_pending', 'processing', 'approved', 'completed'];

const DETAIL_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Draft',       color: '#64748B', bg: '#F1F5F9' },
  submitted:    { label: 'Pending',     color: '#3B82F6', bg: '#EFF6FF' },
  under_review: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  docs_pending: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  processing:   { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7' },
  completed:    { label: 'Approved',    color: '#10B981', bg: '#DCFCE7' },
  rejected:     { label: 'Rejected',    color: '#EF4444', bg: '#FEE2E2' },
};

function getTimelineIndex(status: string): number {
  const map: Record<string, number> = {
    draft: -1, submitted: 0, under_review: 1, docs_pending: 1,
    processing: 2, approved: 3, completed: 4,
  };
  return map[status] ?? 0;
}

// ── Shared header ─────────────────────────────────────────────────────────────
function ScreenHeader({ title, onShare }: { title: string; onShare?: () => void }) {
  return (
    <LinearGradient
      colors={['#1E3A8A', '#2563EB']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        {onShare ? (
          <TouchableOpacity style={styles.headerShareBtn} onPress={onShare}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    </LinearGradient>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ApplicationStatusScreen() {
  const { id, showCert: showCertParam } = useLocalSearchParams<{ id: string; showCert?: string }>();
  const { data: app, isLoading, refetch, isRefetching } = useApplication(id);
  const [showCert, setShowCert] = useState(showCertParam === '1');

  if (isLoading) {
    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="Application Status" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </View>
    );
  }

  if (!app) {
    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="Application Status" />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Application Not Found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#2563EB', fontWeight: '700' }}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showCert && app.certificateUrl) {
    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="View Certificate" />
        <View style={styles.rejectedWhiteContainer}>
          <ScrollView 
            contentContainerStyle={styles.rejectedScrollContent} 
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.summaryCardBox, { padding: 24, alignItems: 'center', gap: 20 }]}>
              {/* Certificate preview card */}
              <View style={styles.certPreviewBox}>
                <Ionicons name="document-text" size={60} color="#2563EB" />
                <Text style={styles.certGovtText}>GOVERNMENT OF INDIA</Text>
                <Text style={styles.certWatermarkText}>{app.serviceName} Certified Watermark</Text>
              </View>

              {/* Holder info */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={styles.certHolderName}>{app.applicantName}</Text>
                <Text style={styles.certRefNo}>Certificate No: {app.applicationRefNo}</Text>
                <Text style={styles.certDateText}>Issued on: {fmtDate(app.completedAt)}</Text>
              </View>

              {/* Actions */}
              <View style={[styles.ctaButtonGroup, { width: '100%', gap: 12 }]}>
                <TouchableOpacity
                  style={[styles.rejectedReapplyBtn, { flexDirection: 'row', gap: 8 }]}
                  onPress={() => Linking.openURL(app.certificateUrl!)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.rejectedReapplyText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rejectedAppealBtn, { flexDirection: 'row', gap: 8 }]}
                  onPress={() =>
                    Share.share({ title: `${app.serviceName} Certificate`, url: app.certificateUrl! })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color="#0F172A" />
                  <Text style={styles.rejectedAppealText}>Share Certificate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Rejected view ────────────────────────────────────────────────────────────
  if (app.status === 'rejected') {
    const handleReapply = () => {
      // Navigate to starting/filling a new form for the same service
      router.push({ pathname: '/(application)/start', params: { id: app.serviceId } });
    };

    const handleAppeal = () => {
      Alert.alert('Appeal Filed', 'Your appeal has been initiated. Our operator queue will contact you.');
    };

    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="Application Detail" />
        
        <View style={styles.rejectedWhiteContainer}>
          <ScrollView
            contentContainerStyle={styles.rejectedScrollContent}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
            showsVerticalScrollIndicator={false}
          >
            {/* Main curved card Frame 1171275233 */}
            <View style={styles.rejectedCardFrame}>
              {/* Red Header inside card */}
              <View style={styles.rejectedCardHeader}>
                <View style={styles.rejectedXCircle}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.rejectedHeaderTexts}>
                  <Text style={styles.rejectedHeaderTitle}>Application Rejected</Text>
                  <Text style={styles.rejectedHeaderSubtitle}>
                    {app.serviceName} • {app.applicationRefNo}
                  </Text>
                </View>
              </View>

              {/* Card content list */}
              <View style={styles.rejectedCardBody}>
                {/* 1. Rejection Reason card */}
                <View style={styles.reasonCardBox}>
                  <Text style={styles.reasonCardTitle}>Rejection Reason</Text>
                  <Text style={styles.reasonCardText}>
                    {app.rejectionReason || 
                      "Document mismatch. The signature on the submitted Aadhaar Card does not match the signature on the self-declaration form. Please re-submit with clear signatures."}
                  </Text>
                </View>

                {/* 2. Summary Card */}
                <View style={styles.summaryCardBox}>
                  <Text style={styles.summaryCardTitle}>Summary</Text>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service</Text>
                    <Text style={styles.summaryValue}>{app.serviceName}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Submitted Date</Text>
                    <Text style={styles.summaryValue}>{fmtDate(app.createdAt)}</Text>
                  </View>

                  <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={styles.summaryLabel}>Department</Text>
                    <Text style={styles.summaryValue}>{app.department || 'Revenue Department'}</Text>
                  </View>
                </View>

                {/* 3. Submitted Documents Card */}
                <View style={styles.docsCardBox}>
                  <Text style={styles.docsCardTitle}>Submitted Documents</Text>
                  
                  <View style={styles.docItemRow}>
                    <View style={styles.docThumbIcon}>
                      <Ionicons name="document-text" size={20} color="#2563EB" />
                    </View>
                    <View style={styles.docTextGroup}>
                      <Text style={styles.docFilename} numberOfLines={1}>Aadhaar_Card.pdf</Text>
                      <Text style={styles.docFilesize}>840 KB</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Action Buttons */}
                <View style={styles.ctaButtonGroup}>
                  <TouchableOpacity
                    style={styles.rejectedReapplyBtn}
                    onPress={handleReapply}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rejectedReapplyText}>Re-Apply Application</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectedAppealBtn}
                    onPress={handleAppeal}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rejectedAppealText}>Appeal Rejection</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── In-Progress timeline view ────────────────────────────────────────────────
  const isInProgress = ['submitted', 'under_review', 'docs_pending', 'processing', 'approved'].includes(app.status);
  if (isInProgress) {
    const currentIdx = getTimelineIndex(app.status);
    const timelineEvents = app.timeline ?? [];

    return (
      <View style={styles.screenBg}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.timelineScrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Application Status" />

          {/* Central Floating Card */}
          <View style={styles.floatingCard}>
            {/* Card Header (Blue) */}
            <View style={styles.cardHeader}>
              <View style={styles.bannerIconBg}>
                <Ionicons name="sync" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.statusBannerText}>
                <Text style={styles.statusBannerTitle}>Application In Progress</Text>
                <Text style={styles.statusBannerSub}>
                  {app.serviceName} • {app.applicationRefNo}
                </Text>
              </View>
            </View>

            {/* Card Content (White with Timeline) */}
            <View style={styles.cardBody}>
              {TIMELINE_STEPS.map((step, idx) => {
                const done = currentIdx > idx;
                const current = currentIdx === idx;
                const pending = currentIdx < idx;

                // Find matching timeline event
                const evt = timelineEvents.find((e) =>
                  e.event.toLowerCase().includes(step.key.replace('_', ' ')) ||
                  (idx === 0 && e.event.toLowerCase().includes('submitted'))
                );

                return (
                  <View key={step.key} style={styles.timelineRow}>
                    {/* Dot + line */}
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.dot,
                          done && styles.dotDone,
                          current && styles.dotCurrent,
                          pending && styles.dotPending,
                        ]}
                      />
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View style={[styles.line, done && styles.lineDone]} />
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          done && styles.timelineLabelDone,
                          current && styles.timelineLabelCurrent,
                          pending && styles.timelineLabelPending,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {evt && (
                        <Text style={styles.timelineTime}>{fmtDateTime(evt.timestamp)}</Text>
                      )}
                      {current && app.slaDeadline && (
                        <Text style={styles.timelineEst}>
                          Est. Completion: {fmtDate(app.slaDeadline)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Completed / General detail view ──────────────────────────────────────────
  const s = DETAIL_STATUS_CONFIG[app.status] ?? DETAIL_STATUS_CONFIG.submitted;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Application Details" />
      <View style={styles.rejectedWhiteContainer}>
        <ScrollView
          contentContainerStyle={styles.rejectedScrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCardBox}>
            {/* Top row with Title + Status Badge */}
            <View style={styles.rejectedHeaderTexts}>
              <Text style={styles.rejectedHeaderTitleDark}>{app.serviceName}</Text>
              <Text style={styles.rejectedHeaderSubtitleDark}>
                {app.applicationRefNo} • {fmtDate(app.createdAt)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: s.bg, position: 'absolute', right: 16, top: 16 }]}>
              <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
            </View>

            {/* Applicant Information */}
            <View style={[styles.summaryCardBox, { borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: '#E2E8F0', borderRadius: 0, paddingHorizontal: 0, paddingBottom: 0, gap: 14 }]}>
              <Text style={styles.summaryCardTitle}>Applicant Information</Text>
              <DetailRow label="Full Name" value={app.applicantName} />
              <DetailRow label="Phone Number" value={app.applicantPhone} />
              {app.applicantAddress && (
                <DetailRow
                  label="New Address"
                  value={Object.values(app.applicantAddress).filter(Boolean).join(', ')}
                  isLast={!app.formData || Object.keys(app.formData).length === 0}
                />
              )}
              {app.formData &&
                Object.entries(app.formData).map(([k, v], idx, arr) => (
                  <DetailRow
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                    value={String(v ?? '—')}
                    isLast={idx === arr.length - 1}
                  />
                ))}
            </View>

            {/* Process Info */}
            <View style={[styles.summaryCardBox, { borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: '#E2E8F0', borderRadius: 0, paddingHorizontal: 0, paddingBottom: 0, gap: 14 }]}>
              <Text style={styles.summaryCardTitle}>Process Info</Text>
              <DetailRow
                label="Fee Paid"
                value={`₹${(app.totalAmount / 100).toFixed(2)} (Success)`}
                valueColor="#10B981"
              />
              {app.assignedOperatorName && (
                <DetailRow 
                  label="Assigned Officer" 
                  value={app.assignedOperatorName} 
                  isLast={!app.department}
                />
              )}
              {app.department && (
                <DetailRow label="Department" value={app.department} isLast={true} />
              )}
            </View>

            {/* Download Payment Receipt */}
            <TouchableOpacity 
              style={[styles.rejectedAppealBtn, { width: '100%', marginTop: 8 }]}
              onPress={() => Alert.alert('Download Started', 'Your receipt is downloading...')}
              activeOpacity={0.85}
            >
              <Text style={styles.rejectedAppealText}>Download Payment Receipt</Text>
            </TouchableOpacity>

            {/* View / Download Certificate — completed */}
            {app.status === 'completed' && app.certificateUrl && (
              <TouchableOpacity
                style={[styles.rejectedReapplyBtn, { width: '100%', marginTop: 8 }]}
                onPress={() => setShowCert(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.rejectedReapplyText}>View Certificate</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ── Detail row helper ──────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor, isLast = false }: { label: string; value?: string | null; valueColor?: string; isLast?: boolean }) {
  return (
    <View style={[styles.summaryRow, isLast ? { borderBottomWidth: 0, paddingBottom: 0 } : {}]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : {}]}>{value ?? '—'}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenBg: { flex: 1, backgroundColor: '#F8FAFC' },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  bannerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.125)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: '#FFFFFF' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  
  // Header
  header: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 1,
    elevation: 0,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },

  content: { padding: spacing.base, gap: spacing.base, paddingBottom: 40 },
  timelineScroll: {
    flex: 1,
    zIndex: 999,
    elevation: 999,
  },
  timelineScrollContainer: {
    flex: 1,
    zIndex: 999,
    elevation: 20,
  },
  timelineScrollContent: {
    paddingBottom: 40,
  },
  floatingCard: {
    marginHorizontal: 20,
    marginTop: -45,
    backgroundColor: 'transparent',
    borderRadius: 20,
    ...shadows.sm,
    zIndex: 1000,
    elevation: 20,
  },
  cardHeader: {
    backgroundColor: '#2563EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  // Status banner (in-progress)
  statusBannerWrap: { backgroundColor: '#2563EB', paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  statusBanner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBannerText: { flex: 1 },
  statusBannerTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontFamily: 'System' },
  statusBannerSub: { fontSize: 13, color: '#EFF6FF', fontWeight: '400', marginTop: 2, fontFamily: 'System' },

  // Rejection banner
  rejBanner: {
    backgroundColor: '#DC2626',
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rejBannerX: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejBannerText: { flex: 1 },
  rejBannerTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  rejBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },

  // Rejection reason
  rejReasonTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  rejReasonText: { fontSize: 13, color: '#334155', lineHeight: 20 },

  // Documents
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  docName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  docSize: { fontSize: 11, color: '#94A3B8' },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#0F172A', maxWidth: '55%', textAlign: 'right' },

  // Completed detail top card
  detailServiceName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  detailMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  detailRef: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  approvedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  approvedBadgeText: { fontSize: 11, fontWeight: '800', color: '#2563EB' },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: 8,
    ...shadows.sm,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  outlineBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 16, minHeight: 68 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  dotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dotCurrent: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 2 },
  dotPending: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 2 },
  line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  lineDone: { backgroundColor: '#10B981' },
  timelineContent: { flex: 1, paddingBottom: 16, paddingLeft: 6 },
  timelineLabel: { fontSize: 15, fontWeight: '600', color: '#64748B', fontFamily: 'System' },
  timelineLabelDone: { color: '#0F172A', fontWeight: '800' },
  timelineLabelCurrent: { color: '#F59E0B', fontWeight: '800' },
  timelineLabelPending: { color: '#64748B', fontWeight: '600' },
  timelineTime: { fontSize: 12, color: '#64748B', fontWeight: '400', marginTop: 4, fontFamily: 'System' },
  timelineEst: { fontSize: 12, color: '#64748B', fontWeight: '400', marginTop: 4, fontFamily: 'System' },

  // Certificate view
  certContent: { alignItems: 'center', padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 },
  certCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: spacing.sm,
    ...shadows.sm,
  },
  certGovt: { fontSize: 15, fontWeight: '900', color: '#1E3A8A', letterSpacing: 0.5 },
  certSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  certName: { fontSize: 22, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  certNo: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  certIssued: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.xl,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    ...shadows.sm,
  },
  downloadBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.xl,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  shareBtnText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  // ── Rejected Detail Specific Styles ─────────────────────────────────────────
  rejectedWhiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
  },
  rejectedScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  rejectedCardFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    ...shadows.sm,
  },
  rejectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#EF4444',
  },
  rejectedXCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.125)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedHeaderTexts: {
    flex: 1,
    gap: 2,
  },
  rejectedHeaderTitle: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rejectedHeaderSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#FEE2E2',
  },
  rejectedHeaderTitleDark: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  rejectedHeaderSubtitleDark: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectedCardBody: {
    padding: 20,
    gap: 16,
  },
  reasonCardBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  reasonCardTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },
  reasonCardText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: '#991B1B',
    lineHeight: 20,
  },
  summaryCardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  summaryCardTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  summaryLabel: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  summaryValue: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  docsCardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  docsCardTitle: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docThumbIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextGroup: {
    flex: 1,
    gap: 2,
  },
  docFilename: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  docFilesize: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  ctaButtonGroup: {
    gap: 12,
    marginTop: 8,
  },
  rejectedReapplyBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedReapplyText: {
    fontFamily: 'System',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectedAppealBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedAppealText: {
    fontFamily: 'System',
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  // Certificate view styles
  certPreviewBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    ...shadows.sm,
  },
  certGovtText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 12,
  },
  certWatermarkText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 4,
  },
  certHolderName: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  certRefNo: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
  },
  certDateText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
  },
});
