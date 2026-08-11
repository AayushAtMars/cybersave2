import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface StepperProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
  stepLabels?: string[];
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  const progress = (currentStep - 1) / (totalSteps - 1);

  return (
    <View style={styles.container}>
      {/* Step indicator dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          return (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isActive && styles.dotActive,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.dotCheck}>✓</Text>
                ) : (
                  <Text style={[styles.dotLabel, isActive && styles.dotLabelActive]}>
                    {step}
                  </Text>
                )}
              </View>
              {step < totalSteps && (
                <View style={styles.connector}>
                  <View
                    style={[
                      styles.connectorFill,
                      { width: isCompleted ? '100%' : '0%' },
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
      {/* Current step label */}
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
        {stepLabels?.[currentStep - 1] ? ` — ${stepLabels[currentStep - 1]}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotCompleted: {
    backgroundColor: colors.status.success,
  },
  dotLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semiBold,
    color: colors.textMuted,
  },
  dotLabelActive: {
    color: colors.textInverse,
  },
  dotCheck: {
    fontSize: typography.size.sm,
    color: colors.textInverse,
    fontWeight: typography.weight.bold,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: colors.status.success,
  },
  stepText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
});
