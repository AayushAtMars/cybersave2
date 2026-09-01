import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export default function Onboarding3() {
    const { t } = useTranslation();
  const handleGetStarted = () => router.push('/(onboarding)/language-select');

  return (
    <View style={styles.container}>
      {/* Title (no skip on last screen) */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding-3.safe_amp_secure')}</Text>
        <Text style={styles.subtitle}>
          
                            {t('onboarding-3.bank_grade_encryption_protects')}{'\n'}{t('onboarding-3.documents_and_personal_identit')}
                          </Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/images/splash/fourth.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* Get Started button */}
      <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.85}>
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaText}>{t('onboarding-3.get_started')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  titleContainer: {
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  illustration: {
    width: width * 0.85,
    height: width * 0.85,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  ctaBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
