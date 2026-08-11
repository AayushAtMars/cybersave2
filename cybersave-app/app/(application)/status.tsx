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

function getTimelineIndex(status: string): number {
  const map: Record<string, number> = {
    draft: -1, submitted: 0, under_review: 1, docs_pending: 1,
    processing: 2, approved: 3, completed: 4,
  };
  return map[status] ?? 0;
}

// ── Shared header ─────────────────────────────────────────────────────────────
function ScreenHeader({ title }: { title: string }) {
  return (
    <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView edges={['top']} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 44 }} />
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

  // ── Certificate view ─────────────────────────────────────────────────────────
  if (showCert && app.certificateUrl) {
    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="View Certificate" />
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.certContent} showsVerticalScrollIndicator={false}>
            {/* Certificate preview card */}
            <View style={styles.certCard}>
              <Ionicons name="document-text" size={60} color="#CBD5E1" />
              <Text style={styles.certGovt}>GOVERNMENT OF INDIA</Text>
              <Text style={styles.certSubtitle}>{app.serviceName} Certificate</Text>
            </View>

            {/* Holder info */}
            <Text style={styles.certName}>{app.applicantName}</Text>
            <Text style={styles.certNo}>Certificate No: {app.applicationRefNo}</Text>
            <Text style={styles.certIssued}>Issued on: {fmtDate(app.completedAt)}</Text>

            {/* Actions */}
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => Linking.openURL(app.certificateUrl!)}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Download PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() =>
                Share.share({ title: `${app.serviceName} Certificate`, url: app.certificateUrl! })
              }
            >
              <Ionicons name="share-social-outline" size={18} color="#0F172A" />
              <Text style={styles.shareBtnText}>Share Certificate</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Rejected view ────────────────────────────────────────────────────────────
  if (app.status === 'rejected') {
    return (
      <View style={styles.screenBg}>
        <ScreenHeader title="Application Detail" />
        <View style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
            showsVerticalScrollIndicator={false}
          >
            {/* Red rejection banner */}
            <View style={styles.rejBanner}>
              <TouchableOpacity style={styles.rejBannerX}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.rejBannerText}>
                <Text style={styles.rejBannerTitle}>Application Rejected</Text>
                <Text style={styles.rejBannerSub}>
                  {app.serviceName} • {app.applicationRefNo}
                </Text>
              </View>
            </View>

            {/* Rejection reason */}
            {app.rejectionReason && (
              <View style={styles.card}>
                <Text style={styles.rejReasonTitle}>Rejection Reason</Text>
                <Text style={styles.rejReasonText}>{app.rejectionReason}</Text>
              </View>
            )}

            {/* Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Summary</Text>
              <DetailRow label="Service" value={app.serviceName} />
              <DetailRow label="Submitted Date" value={fmtDate(app.createdAt)} />
              {app.department && (
                <DetailRow label="Department" value={app.department} />
              )}
            </View>

            {/* Documents */}
            {app.documentIds && app.documentIds.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Submitted Documents</Text>
                {app.documentIds.map((docId, i) => (
                  <View key={i} style={styles.docRow}>
                    <Ionicons name="document-text" size={20} color="#2563EB" />
                    <View>
                      <Text style={styles.docName}>Attachment {i + 1}</Text>
                      <Text style={styles.docSize}>ID: {docId.slice(-8).toUpperCase()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* CTAs */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/(application)/start', params: { id: app.serviceId } })}
            >
              <Text style={styles.primaryBtnText}>Re-Apply Application</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Appeal Rejection</Text>
            </TouchableOpacity>
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
                <Ionicons name="sync" size={16} color="#ffffff" />
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
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Application Details" />
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Top info card */}
          <View style={styles.card}>
            <Text style={styles.detailServiceName}>{app.serviceName}</Text>
            <View style={styles.detailMeta}>
              <Text style={styles.detailRef}>{app.applicationRefNo} • {fmtDate(app.createdAt)}</Text>
              <View style={styles.approvedBadge}>
                <Text style={styles.approvedBadgeText}>Approved</Text>
              </View>
            </View>
          </View>

          {/* Applicant info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Applicant Information</Text>
            <DetailRow label="Full Name" value={app.applicantName} />
            <DetailRow label="Phone Number" value={app.applicantPhone} />
            {app.applicantAddress && (
              <DetailRow
                label="Address"
                value={Object.values(app.applicantAddress).filter(Boolean).join(', ')}
              />
            )}
            {app.formData &&
              Object.entries(app.formData).map(([k, v]) => (
                <DetailRow
                  key={k}
                  label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                  value={String(v ?? '—')}
                />
              ))}
          </View>

          {/* Process info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Process Info</Text>
            <DetailRow
              label="Fee Paid"
              value={`₹${(app.totalAmount / 100).toFixed(2)} (Success)`}
              valueColor="#16A34A"
            />
            {app.assignedOperatorName && (
              <DetailRow label="Assigned Officer" value={app.assignedOperatorName} />
            )}
            {app.department && (
              <DetailRow label="Department" value={app.department} />
            )}
          </View>

          {/* Download receipt */}
          <TouchableOpacity style={styles.outlineBtn}>
            <Ionicons name="receipt-outline" size={16} color="#0F172A" />
            <Text style={styles.outlineBtnText}>Download Payment Receipt</Text>
          </TouchableOpacity>

          {/* View / Download Certificate — completed */}
          {app.status === 'completed' && app.certificateUrl && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowCert(true)}
            >
              <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>View Certificate</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Detail row helper ──────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>{value ?? '—'}</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: '#FFFFFF' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

  // Header
  header: { paddingHorizontal: spacing.base, paddingBottom: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, zIndex: 1, elevation: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1, textAlign: 'center' },

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
    borderRadius: 24,
    ...shadows.md,
    zIndex: 1000,
    elevation: 20,
  },
  cardHeader: {
    backgroundColor: '#2563EB',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardBody: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  statusBannerTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statusBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },

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
  timelineRow: { flexDirection: 'row', gap: spacing.md, minHeight: 70 },
  timelineLeft: { alignItems: 'center', width: 22 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  dotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  dotCurrent: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 2.5 },
  dotPending: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 2 },
  line: { width: 3, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4, minHeight: 30 },
  lineDone: { backgroundColor: '#10B981' },
  timelineContent: { flex: 1, paddingBottom: spacing.md, paddingLeft: 6 },
  timelineLabel: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  timelineLabelDone: { color: '#1E293B', fontWeight: '700' },
  timelineLabelCurrent: { color: '#D97706', fontWeight: '700' },
  timelineLabelPending: { color: '#64748B', fontWeight: '600' },
  timelineTime: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 4 },
  timelineEst: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 4 },

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
});
