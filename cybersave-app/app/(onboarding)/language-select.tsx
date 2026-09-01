import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { shadows } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleContinue = () => {
    if (isAuthenticated) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Blue gradient header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={{ flex: 0 }} />
        <View style={styles.headerRow}>
          {router.canGoBack() ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.headerTitle}>{t('languageSelect.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* White container card */}
      <View style={styles.card}>
        <FlatList
          data={LANGUAGES}
          numColumns={2}
          keyExtractor={(item) => item.code}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.hintText}>
              {t('languageSelect.subtitle')}
            </Text>
          }
          renderItem={({ item }) => {
            const isSelected = selected === item.code;
            return (
              <TouchableOpacity
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => {
                  setSelected(item.code);
                  i18n.changeLanguage(item.code);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.langTexts}>
                  <Text style={styles.langNative}>{item.native}</Text>
                  <Text style={styles.langName}>{item.name}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Continue button footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.85}>
            <LinearGradient
              colors={['#1E3A8A', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>{t('languageSelect.continue')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'System',
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 0,
    zIndex: 2,
    ...shadows.sm,
  },
  hintText: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'System',
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  langCard: {
    width: '48%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  langCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  langTexts: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  langNative: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'System',
  },
  langName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'System',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    borderWidth: 0,
  },
  footer: {
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  continueBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
});
