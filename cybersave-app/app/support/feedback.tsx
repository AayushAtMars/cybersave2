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
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Feedback</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      {/* Main Form container */}
      <ScrollView 
        style={styles.whiteContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rate experience Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate Your Experience</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons 
                  name={star <= rating ? 'star' : 'star-outline'} 
                  size={32} 
                  color="#EAB308" 
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingSub}>
            You selected {rating} stars ({ratingLabels[rating]})
          </Text>
        </View>

        {/* What should we improve? */}
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

        {/* Write your feedback */}
        <Text style={styles.fieldLabel}>Write your feedback</Text>
        <TextInput
          style={styles.textarea}
          value={feedbackText}
          onChangeText={setFeedbackText}
          placeholder="Tell us what went well or what we can fix..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
        />

        {/* Attachment row & Submit */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={18} color="#2563EB" />
            <Text style={styles.attachBtnText}>
              {attachment ? `Attached: ${attachment.slice(0, 10)}...` : 'Attach Image'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitFeedback} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reviews Feed */}
        <Text style={styles.sectionHeader}>Recent Reviews</Text>
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>Rakesh K.</Text>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={12} color="#EAB308" />
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
                <Ionicons key={s} name="star" size={12} color="#EAB308" />
              ))}
              <Ionicons name="star-outline" size={12} color="#EAB308" />
            </View>
          </View>
          <Text style={styles.reviewText}>
            Very intuitive UI, but I got a minor delay in Aadhaar update status. Overall nice.
          </Text>
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
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.base,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: spacing.base,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: -4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tagSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  tagText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#2563EB',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    fontSize: 13,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
    ...shadows.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  attachBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: spacing.sm,
    marginBottom: -4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 6,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.xs,
  },
  successDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  successDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
