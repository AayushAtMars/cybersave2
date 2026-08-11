import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
];

export default function LanguageSelect() {
  const [selected, setSelected] = useState('en');

  const handleContinue = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A4DB5" />

      {/* Blue gradient header */}
      <LinearGradient
        colors={['#1A4DB5', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.headerTitle}>Choose Your Language</Text>
      </LinearGradient>

      {/* White card */}
      <View style={styles.card}>
        {/* Dashed border hint text */}
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            Select your preferred language to customize the app interface and official services.
          </Text>
        </View>

        {/* Language grid */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: Math.ceil(LANGUAGES.length / 2) }).map((_, rowIdx) => {
            const left = LANGUAGES[rowIdx * 2];
            const right = LANGUAGES[rowIdx * 2 + 1];
            return (
              <View key={rowIdx} style={styles.row}>
                {[left, right].map((lang) =>
                  lang ? (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langCard,
                        selected === lang.code && styles.langCardSelected,
                      ]}
                      onPress={() => setSelected(lang.code)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.langCardInner}>
                        <View style={styles.langTexts}>
                          <Text
                            style={[
                              styles.langNative,
                              selected === lang.code && styles.langNativeSelected,
                            ]}
                          >
                            {lang.native}
                          </Text>
                          <Text
                            style={[
                              styles.langName,
                              selected === lang.code && styles.langNameSelected,
                            ]}
                          >
                            {lang.name}
                          </Text>
                        </View>
                        {/* Radio */}
                        <View
                          style={[
                            styles.radio,
                            selected === lang.code && styles.radioSelected,
                          ]}
                        >
                          {selected === lang.code && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View key="empty" style={styles.langCardEmpty} />
                  )
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Continue button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1E3A8A', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = (width - 48 - 10) / 2; // 24px padding each side, 10px gap

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 28,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  hintBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  hintText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  langCard: {
    width: CARD_WIDTH,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  langCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  langCardEmpty: {
    width: CARD_WIDTH,
  },
  langCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langTexts: {
    flex: 1,
  },
  langNative: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  langNativeSelected: {
    color: '#1E3A8A',
  },
  langName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  langNameSelected: {
    color: '#2563EB',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  continueBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
