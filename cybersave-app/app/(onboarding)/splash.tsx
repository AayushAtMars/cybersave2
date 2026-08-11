import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/onboarding-1');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <LinearGradient
      colors={['#C8D8F0', '#7BA7D8', '#2255A4', '#0B2D6E']}
      locations={[0, 0.3, 0.65, 1]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/splash/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Tagline */}
      <View style={styles.taglineContainer}>
        <Text style={styles.taglineMain}>All Government Services, One App</Text>
        <Text style={styles.taglineSub}>Ministry of Electronics &amp; IT Initiative</Text>
      </View>

      {/* Digital India Badge */}
      <View style={styles.badge}>
        {/* Indian flag stripes */}
        <View style={styles.flagStripes}>
          <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
          <View style={[styles.stripe, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
        </View>
        <View style={styles.badgeDivider} />
        <Text style={styles.badgeText}>DIGITAL INDIA</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: width * 0.55,
    height: width * 0.55,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  taglineMain: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  taglineSub: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    gap: 10,
  },
  flagStripes: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  stripe: {
    width: 14,
    height: 6,
    borderRadius: 2,
  },
  badgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
