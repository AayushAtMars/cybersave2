import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, radius, typography, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  style,
  disabled,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textInverse : colors.primary}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  destructive: {
    backgroundColor: colors.status.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  size_md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 48 },
  size_lg: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, minHeight: 56 },
  // States
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  // Labels
  label: {
    fontWeight: typography.weight.semiBold,
    letterSpacing: 0.2,
  } as TextStyle,
  label_primary: { color: colors.textInverse },
  label_secondary: { color: colors.primary },
  label_destructive: { color: colors.textInverse },
  label_ghost: { color: colors.primary },
  labelSize_sm: { fontSize: typography.size.sm },
  labelSize_md: { fontSize: typography.size.base },
  labelSize_lg: { fontSize: typography.size.md },
});
