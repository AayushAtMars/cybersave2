/**
 * Admin Dashboard — view all tickets, approve/reject, upload certificates
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAdminApplications,
  useAdminStats,
  useUpdateApplicationStatus,
  useUploadCertificate,
} from '../../src/api/applications';
import type { Application } from '../../src/api/applications';
import { shadows, spacing, radius } from '../../src/theme';
import { useTranslation } from "react-i18next";

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'submitted' },
  { label: 'In Review', value: 'under_review' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Draft',       color: '#64748B', bg: '#F1F5F9' },
  submitted:    { label: 'Pending',     color: '#D97706', bg: '#FEF3C7' },
  under_review: { label: 'In Review',   color: '#2563EB', bg: '#EFF6FF' },
  docs_pending: { label: 'Docs Needed', color: '#7C3AED', bg: '#EDE9FE' },
  processing:   { label: 'Processing',  color: '#0891B2', bg: '#E0F2FE' },
  approved:     { label: 'Approved',    color: '#16A34A', bg: '#DCFCE7' },
  completed:    { label: 'Completed',   color: '#16A34A', bg: '#DCFCE7' },
  rejected:     { label: 'Rejected',    color: '#DC2626', bg: '#FEE2E2' },
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AdminDashboard() {
    const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'certificate' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [certDept, setCertDept] = useState('');

  const { data, isLoading, refetch, isRefetching } = useAdminApplications(
    statusFilter === 'all' ? undefined : statusFilter,
    search.length > 1 ? search : undefined
  );
  const { data: stats } = useAdminStats();
  const updateStatus = useUpdateApplicationStatus();
  const uploadCert = useUploadCertificate();

  const apps = data?.items ?? [];
  const cfg = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.submitted;

  const openAction = (app: Application, action: 'approve' | 'reject' | 'certificate') => {
    setSelected(app);
    setRejectionReason('');
    setCertUrl('');
    setCertDept('');
    setActionModal(action);
  };

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await updateStatus.mutateAsync({ id: selected._id, status: 'approved' });
      setActionModal(null);
      Alert.alert('✅ Approved', `${selected.serviceName} has been approved.`);
    } catch {
      Alert.alert('Error', 'Failed to approve. Try again.');
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: selected._id, status: 'rejected', rejectionReason });
      setActionModal(null);
      Alert.alert('❌ Rejected', `${selected.serviceName} has been rejected.`);
    } catch {
      Alert.alert('Error', 'Failed to reject. Try again.');
    }
  };

  const handleUploadCert = async () => {
    if (!selected) return;
    if (!certUrl.trim()) {
      Alert.alert('Required', 'Please enter a valid certificate URL.');
      return;
    }
    try {
      await uploadCert.mutateAsync({ id: selected._id, certificateUrl: certUrl, department: certDept });
      setActionModal(null);
      Alert.alert('🏆 Certificate Uploaded', `Certificate added and application marked as Completed.`);
    } catch {
      Alert.alert('Error', 'Failed to upload certificate. Try again.');
    }
  };

  return (
    <View style={styles.flex}>
      <LinearGradient colors={['#1E3A8A', '#2563EB']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>{t('dashboard.admin_portal')}</Text>
            <Text style={styles.headerTitle}>{t('dashboard.application_dashboard')}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={22} color="#2563EB" />
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <StatChip icon="documents-outline" label="Total" value={stats?.totalApplications ?? '—'} />
          <StatChip icon="time-outline" label="Pending" value={stats?.pendingReview ?? '—'} color="#F59E0B" />
          <StatChip icon="checkmark-circle-outline" label="Completed" value={stats?.completedCount ?? '—'} color="#22C55E" />
          <StatChip icon="alert-circle-outline" label="SLA Breach" value={stats?.slaBreached ?? '—'} color="#EF4444" />
        </View>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ref, service..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setStatusFilter(f.value)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : apps.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={52} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>{t('dashboard.no_applications')}</Text>
          </View>
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(a) => a._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const s = cfg(item.status);
              const canApprove = ['submitted', 'under_review', 'processing'].includes(item.status);
              const canReject = ['submitted', 'under_review', 'processing'].includes(item.status);
              const canCert = item.status === 'approved' || item.status === 'completed';

              return (
                <View style={styles.card}>
                  {/* Card top */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconBg}>
                      <Ionicons name="document-text" size={20} color="#2563EB" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardService} numberOfLines={1}>{item.serviceName}</Text>
                      <Text style={styles.cardMeta}>
                        {item.applicationRefNo} • {item.applicantName ?? '—'}
                      </Text>
                      <Text style={styles.cardDate}>{t('dashboard.submitted')} {fmtDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>

                  {/* Rejection reason */}
                  {item.rejectionReason && (
                    <View style={styles.rejBox}>
                      <Text style={styles.rejText} numberOfLines={2}>{item.rejectionReason}</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    {canApprove && (
                      <TouchableOpacity style={styles.approveBtn} onPress={() => openAction(item, 'approve')}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#16A34A" />
                        <Text style={styles.approveBtnText}>{t('dashboard.approve')}</Text>
                      </TouchableOpacity>
                    )}
                    {canReject && (
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => openAction(item, 'reject')}>
                        <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>{t('dashboard.reject')}</Text>
                      </TouchableOpacity>
                    )}
                    {canCert && (
                      <TouchableOpacity style={styles.certBtn} onPress={() => openAction(item, 'certificate')}>
                        <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.certBtnText}>
                          {item.certificateUrl ? 'Update Cert' : 'Add Certificate'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Approve modal */}
      <ActionModal
        visible={actionModal === 'approve'}
        title="Approve Application"
        onClose={() => setActionModal(null)}
      >
        <Text style={styles.modalBody}>
          
                            {t('dashboard.are_you_sure_you_want_to_appro')}{'\n'}
          <Text style={{ fontWeight: '800' }}>{selected?.serviceName}</Text>  {t('dashboard.for')}{' '}
          <Text style={{ fontWeight: '800' }}>{selected?.applicantName}</Text>?
        </Text>
        <Text style={styles.modalNote}>
          
                            {t('dashboard.the_applicant_will_be_notified')}
                          </Text>
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: '#16A34A' }]}
          onPress={handleApprove}
          disabled={updateStatus.isPending}
        >
          {updateStatus.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.modalBtnText}>{t('dashboard.confirm_approval')}</Text>
          )}
        </TouchableOpacity>
      </ActionModal>

      {/* Reject modal */}
      <ActionModal
        visible={actionModal === 'reject'}
        title="Reject Application"
        onClose={() => setActionModal(null)}
      >
        <Text style={styles.modalLabel}>{t('dashboard.rejection_reason')}</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Describe why this application is rejected..."
          placeholderTextColor="#94A3B8"
          value={rejectionReason}
          onChangeText={setRejectionReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: '#DC2626' }]}
          onPress={handleReject}
          disabled={updateStatus.isPending}
        >
          {updateStatus.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.modalBtnText}>{t('dashboard.confirm_rejection')}</Text>
          )}
        </TouchableOpacity>
      </ActionModal>

      {/* Certificate upload modal */}
      <ActionModal
        visible={actionModal === 'certificate'}
        title="Upload Certificate"
        onClose={() => setActionModal(null)}
      >
        <Text style={styles.modalLabel}>{t('dashboard.certificate_url')}</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="https://storage.example.com/certificates/..."
          placeholderTextColor="#94A3B8"
          value={certUrl}
          onChangeText={setCertUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.modalLabel}>{t('dashboard.department_optional')}</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="e.g. Revenue Department"
          placeholderTextColor="#94A3B8"
          value={certDept}
          onChangeText={setCertDept}
        />
        <Text style={styles.modalNote}>
          
                            {t('dashboard.once_uploaded_the_application_')}
                          </Text>
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: '#2563EB' }]}
          onPress={handleUploadCert}
          disabled={uploadCert.isPending}
        >
          {uploadCert.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.modalBtnText}>{t('dashboard.upload_complete')}</Text>
          )}
        </TouchableOpacity>
      </ActionModal>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatChip({ icon, label, value, color = '#FFFFFF' }: { icon: string; label: string; value: any; color?: string }) {
  return (
    <View style={statStyles.chip}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function ActionModal({
  visible, title, onClose, children,
}: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#2563EB' },
  header: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: spacing.xs },
  headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  body: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: spacing.base,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: radius.xl,
    marginHorizontal: spacing.base, paddingHorizontal: spacing.md,
    paddingVertical: 10, gap: spacing.sm, ...shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  filtersRow: {
    paddingHorizontal: spacing.base, gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  pill: {
    paddingVertical: 7, paddingHorizontal: 16,
    borderRadius: radius.full, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm,
  },
  pillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },

  list: { padding: spacing.base, gap: spacing.sm, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#64748B' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: radius.xl,
    padding: spacing.base, gap: spacing.sm, ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardIconBg: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardService: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  cardMeta: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  cardDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontWeight: '800' },

  rejBox: {
    backgroundColor: '#FEF2F2', borderRadius: radius.lg,
    padding: spacing.sm, borderLeftWidth: 3, borderLeftColor: '#DC2626',
  },
  rejText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1, borderColor: '#86EFAC',
  },
  approveBtnText: { fontSize: 11, fontWeight: '800', color: '#16A34A' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1, borderColor: '#FECACA',
  },
  rejectBtnText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  certBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.full,
  },
  certBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  // Modal / Bottom Sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.xl, paddingBottom: 48,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalBody: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: spacing.sm },
  modalNote: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: spacing.md },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: spacing.sm },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 13,
    color: '#0F172A', backgroundColor: '#F8FAFC', marginBottom: spacing.sm,
  },
  modalBtn: {
    paddingVertical: 14, borderRadius: radius.xl,
    alignItems: 'center', marginTop: spacing.sm, ...shadows.sm,
  },
  modalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

const statStyles = StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg, padding: spacing.sm,
  },
  value: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' },
});
