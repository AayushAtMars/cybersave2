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

const { width } = Dimensions.get('window');

export default function Onboarding1() {
  const handleNext = () => router.push('/(onboarding)/onboarding-2');
  const handleSkip = () => router.replace('/(auth)/login');

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          Welcome to{' '}
          <Text style={styles.titleBlue}>Cyber</Text>
          <Text style={styles.titleBold}>save</Text>
        </Text>
        <Text style={styles.subtitle}>
          Access 500+ central and state government{'\n'}services securely from your phone.
        </Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/images/splash/second.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Next button */}
      <TouchableOpacity
  onPress={handleNext}
  activeOpacity={0.85}
>
  <LinearGradient
    colors={['#1E3A8A', '#2563EB']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.ctaBtn}
  >
    <Text style={styles.ctaText}>Next</Text>
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
    paddingTop: 60,
    paddingBottom: 48,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  titleContainer: {
    marginTop: 8,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
  },
  titleBlue: {
    fontSize: 28,
    color: '#0F172A',
  },
  titleBold: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563EB',
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
