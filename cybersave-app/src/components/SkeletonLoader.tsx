import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, spacing } from '../theme';

// Pulse animation for skeleton shimmer effect
const SkeletonBox: React.FC<{ width?: number | string; height?: number; borderRadius?: number }> = ({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
}) => {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
      ]}
    />
  );
};

// Pre-built skeleton patterns for specific screens
export const ApplicationCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonBox width={120} height={14} />
      <SkeletonBox width={70} height={22} borderRadius={radius.full} />
    </View>
    <SkeletonBox width="80%" height={18} />
    <SkeletonBox width={60} height={12} />
  </View>
);

export const ServiceCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    <SkeletonBox width={48} height={48} borderRadius={radius.md} />
    <SkeletonBox width="70%" height={16} />
    <SkeletonBox width="50%" height={12} />
  </View>
);

export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.page}>
    <SkeletonBox width="100%" height={180} borderRadius={radius.xl} />
    <View style={styles.row}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBox key={i} width={72} height={80} borderRadius={radius.lg} />
      ))}
    </View>
    <SkeletonBox width={140} height={20} />
    {[1, 2, 3].map((i) => (
      <ApplicationCardSkeleton key={i} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  page: {
    padding: spacing.base,
    gap: spacing.md,
  },
});

export { SkeletonBox };
