export const colors = {
  // Brand gradient
  primary: '#2563EB',
  primaryDark: '#0B3D91',
  primaryLight: '#3B82F6',
  primaryGhost: '#EFF6FF',

  // Background
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4FF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status system — shared across all three surfaces (design.md §2)
  status: {
    success: '#16A34A',
    successBg: '#F0FDF4',
    pending: '#D97706',
    pendingBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    inProgress: '#2563EB',
    inProgressBg: '#EFF6FF',
  },

  // UI
  border: '#E2E8F0',
  borderFocus: '#2563EB',
  divider: '#F1F5F9',
  overlay: 'rgba(0,0,0,0.5)',

  // Semantic
  warning: '#F59E0B',
  info: '#0EA5E9',

  // Tab bar
  tabActive: '#2563EB',
  tabInactive: '#94A3B8',
} as const;

export const statusColors = {
  draft: { text: colors.textMuted, bg: colors.divider },
  submitted: { text: colors.status.inProgress, bg: colors.status.inProgressBg },
  under_review: { text: colors.status.pending, bg: colors.status.pendingBg },
  processing: { text: colors.status.inProgress, bg: colors.status.inProgressBg },
  approved: { text: colors.status.success, bg: colors.status.successBg },
  completed: { text: colors.status.success, bg: colors.status.successBg },
  rejected: { text: colors.status.error, bg: colors.status.errorBg },
  // Document status
  pending: { text: colors.status.pending, bg: colors.status.pendingBg },
  verified: { text: colors.status.success, bg: colors.status.successBg },
  // Ticket status
  open: { text: colors.status.pending, bg: colors.status.pendingBg },
  in_progress: { text: colors.status.inProgress, bg: colors.status.inProgressBg },
  resolved: { text: colors.status.success, bg: colors.status.successBg },
  closed: { text: colors.textMuted, bg: colors.divider },
} as const;

export type StatusKey = keyof typeof statusColors;
