import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import type { TutorReview } from '../../services/reviewApi';

interface WriteReviewModalProps {
  visible: boolean;
  initialReview?: TutorReview | null;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: { rating: number; reviewText: string; subject: string; studentClass: string }) => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ visible, initialReview, isSubmitting, error, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [subject, setSubject] = useState('');
  const [studentClass, setStudentClass] = useState('');

  useEffect(() => {
    if (!visible) return;
    setRating(initialReview?.rating || 5);
    setReviewText(initialReview?.reviewText || '');
    setSubject(initialReview?.subject || '');
    setStudentClass(initialReview?.studentClass || '');
  }, [visible, initialReview]);

  const isValid = rating >= 1 && rating <= 5 && reviewText.trim().length >= 10 && subject.trim().length >= 2 && studentClass.trim().length >= 1;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{initialReview ? 'Edit Review' : 'Write Review'}</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={isSubmitting}>
                <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={32} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Review Text</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share what helped your child learn better..."
            placeholderTextColor={colors.textTertiary}
            maxLength={1000}
            editable={!isSubmitting}
          />

          <View style={styles.twoCol}>
            <View style={styles.field}>
              <Text style={styles.label}>Subject</Text>
              <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Maths" placeholderTextColor={colors.textTertiary} editable={!isSubmitting} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Class</Text>
              <TextInput style={styles.input} value={studentClass} onChangeText={setStudentClass} placeholder="Class 8" placeholderTextColor={colors.textTertiary} editable={!isSubmitting} />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, (!isValid || isSubmitting) && styles.submitButtonDisabled]}
            disabled={!isValid || isSubmitting}
            onPress={() => onSubmit({ rating, reviewText: reviewText.trim(), subject: subject.trim(), studentClass: studentClass.trim() })}
          >
            {isSubmitting ? <ActivityIndicator color={colors.textWhite} /> : <Text style={styles.submitText}>{initialReview ? 'Save Changes' : 'Submit Review'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  input: { backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.text },
  textArea: { height: 118, textAlignVertical: 'top', marginBottom: 14 },
  twoCol: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 12, fontWeight: '600' },
  submitButton: { marginTop: 18, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitButtonDisabled: { opacity: 0.55 },
  submitText: { color: colors.textWhite, fontSize: 15, fontWeight: '800' },
});

export default WriteReviewModal;
