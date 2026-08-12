import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, radius, shadows } from '../../src/theme';

export default function ShareFeedbackScreen() {
  const [rating, setRating] = useState(4);
  const [selectedTags, setSelectedTags] = useState<string[]>(['App Experience']);
  const [feedbackText, setFeedbackText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);

  // Success notifications
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  const tags = ['App Experience', 'Service Quality', 'Support'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAttachImage = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAttachment(res.assets[0].name);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Validation Error', 'Please write your feedback message before submitting.');
      return;
    }

    setSuccessMsg('Your feedback has been successfully submitted. We appreciate your response!');
    setShowSuccessModal(true);
  };

  const handleDismissSuccess = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <View style={styles.flex}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Feedback</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Main Form container */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.whiteCardContainer}>
          {/* Rate experience Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate Your Experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                  <Ionicons 
                    name={star <= rating ? 'star' : 'star-outline'} 
                    size={28} 
                    color={star <= rating ? '#F59E0B' : '#E2E8F0'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingSub}>
              You selected {rating} stars ({ratingLabels[rating]})
            </Text>
          </View>

          {/* What should we improve? */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>What should we improve?</Text>
            <View style={styles.tagsRow}>
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tag, isSelected && styles.tagSelected]} 
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Write your feedback */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Write your feedback</Text>
            <TextInput
              style={styles.textarea}
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what went well or what we can fix..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Attachment row & Submit */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={16} color="#2563EB" />
              <Text style={styles.attachBtnText} numberOfLines={1}>
                {attachment ? `Attached: ${attachment}` : 'Attach Image'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitFeedback} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Reviews Feed */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionHeader}>Recent Reviews</Text>
            <View style={styles.reviewsList}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>Rakesh K.</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>
                  Extremely smooth ITR filing experience! Verified within seconds.
                </Text>
              </View>

              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>Ananya S.</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4].map((s) => (
                      <Ionicons key={s} name="star" size={12} color="#F59E0B" />
                    ))}
                    <Ionicons name="star" size={12} color="#E2E8F0" />
                  </View>
                </View>
                <Text style={styles.reviewText}>
                  Very intuitive UI, but I got a minor delay in Aadhaar update status. Overall nice.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleDismissSuccess}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconOuter}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.successTitle}>Feedback Sent!</Text>
            <Text style={styles.successSub}>{successMsg}</Text>
            <TouchableOpacity 
              style={styles.successDoneBtn} 
              onPress={handleDismissSuccess}
              activeOpacity={0.8}
            >
              <Text style={styles.successDoneBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 25,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -32,
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  whiteCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 16,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 15,
  },
  field: {
    gap: 8,
    alignSelf: 'stretch',
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'stretch',
  },
  tag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 16,
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    height: 80,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    alignSelf: 'stretch',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'stretch',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  attachBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 17,
  },
  reviewsSection: {
    gap: 12,
    alignSelf: 'stretch',
  },
  sectionHeader: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  reviewsList: {
    gap: 8,
    alignSelf: 'stretch',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    gap: 4,
    alignSelf: 'stretch',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  reviewerName: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 16,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
