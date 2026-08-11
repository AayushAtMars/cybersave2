import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function SuccessScreen() {
  const scale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Reference info (in a real app this would come from route params / store)
  const refNo = 'CSC-2024-78432';
  const submittedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    // Pop-in animation for checkmark
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.15,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in the rest of the content
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 500,
      delay: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.flex}>
      {/* Gradient top section */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.topSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} />

        {/* Progress bar at 100% */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '100%' }]} />
        </View>

        <Text style={styles.stepLabel}>Step 5/5</Text>

        {/* Animated check badge */}
        <Animated.View style={[styles.checkBadge, { transform: [{ scale }] }]}>
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={44} color="#2563EB" />
          </View>
        </Animated.View>

        <Text style={styles.heroTitle}>Application Submitted!</Text>
        <Text style={styles.heroSubtitle}>
          Your application has been received and is now in our processing queue.
        </Text>
      </LinearGradient>

      {/* Details section */}
      <Animated.View style={[styles.detailsWrapper, { opacity: contentOpacity }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Reference card */}
          <View style={styles.refCard}>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Reference No.</Text>
              <Text style={styles.refValue}>{refNo}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Submitted On</Text>
              <Text style={styles.refValue}>{submittedDate}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Est. Completion</Text>
              <Text style={[styles.refValue, styles.greenText]}>{estimatedDate}</Text>
            </View>
          </View>

          {/* What's next */}
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>What happens next?</Text>
            <View style={styles.nextList}>
              <View style={styles.nextItem}>
                <View style={styles.nextDot} />
                <Text style={styles.nextText}>
                  Our operator will verify your documents within 24 hours
                </Text>
              </View>
              <View style={styles.nextItem}>
                <View style={styles.nextDot} />
                <Text style={styles.nextText}>
                  You'll receive SMS and in-app notifications at every stage
                </Text>
              </View>
              <View style={styles.nextItem}>
                <View style={styles.nextDot} />
                <Text style={styles.nextText}>
                  Once processed, your certificate will be available to download
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/applications')}
            activeOpacity={0.85}
          >
            <Ionicons name="location-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Track Application Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              // In a real app: generate and download a receipt PDF
              router.replace('/(tabs)/applications');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={18} color="#2563EB" />
            <Text style={styles.secondaryBtnText}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.replace('/(tabs)/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.ghostBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },

  topSection: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    gap: spacing.sm,
  },

  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  checkBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  checkInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.base,
  },

  detailsWrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.base,
    paddingBottom: 40,
  },

  refCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    ...shadows.sm,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  refValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  greenText: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  nextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  nextList: {
    gap: spacing.sm,
  },
  nextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 5,
    flexShrink: 0,
  },
  nextText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 18,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: radius.xl,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    ...shadows.sm,
  },
  secondaryBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '800',
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
