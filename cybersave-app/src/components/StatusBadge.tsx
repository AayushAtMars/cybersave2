import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography, spacing, statusColors, StatusKey } from '../theme';

interface StatusBadgeProps {
  status: StatusKey;
  label?: string; // Override the displayed label
}

// Human-readable label map
const statusLabels: Record<StatusKey, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  processing: 'Processing',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  pending: 'Pending',
  verified: 'Verified',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const { text, bg } = statusColors[status] ?? statusColors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: text }]} />
      <Text style={[styles.label, { color: text }]}>{label ?? statusLabels[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semiBold,
    letterSpacing: 0.3,
  },
});
