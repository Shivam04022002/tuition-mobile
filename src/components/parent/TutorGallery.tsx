import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const { width } = Dimensions.get('window');
const GALLERY_ITEM_SIZE = width * 0.55;

interface GalleryItem {
  uri: string;
  type: 'certificate' | 'qualification' | 'portfolio';
  label?: string;
}

interface TutorGalleryProps {
  certificates: Array<{ name: string; issuer: string; year: number; url: string | null }>;
  qualificationImages: string[];
  portfolioPhotos: string[];
  onImagePress?: (uri: string, index: number) => void;
}

const TutorGallery: React.FC<TutorGalleryProps> = ({
  certificates,
  qualificationImages,
  portfolioPhotos,
  onImagePress,
}) => {
  const allItems: GalleryItem[] = [];

  // Add portfolio photos
  portfolioPhotos.forEach((uri) => {
    allItems.push({ uri, type: 'portfolio', label: 'Teaching Photo' });
  });

  // Add qualification images
  qualificationImages.forEach((uri) => {
    allItems.push({ uri, type: 'qualification', label: 'Qualification' });
  });

  // Add certificate images
  certificates.forEach((cert) => {
    if (cert.url) {
      allItems.push({ uri: cert.url, type: 'certificate', label: cert.name });
    }
  });

  if (allItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Gallery</Text>
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No Gallery Available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Gallery</Text>
        <Text style={styles.countBadge}>{allItems.length} items</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allItems.map((item, index) => (
          <TouchableOpacity
            key={`${item.type}-${index}`}
            style={styles.galleryItem}
            onPress={() => onImagePress?.(item.uri, index)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.uri }} style={styles.galleryImage} />
            <View style={styles.galleryOverlay}>
              <View style={styles.typeBadge}>
                <Ionicons
                  name={
                    item.type === 'certificate'
                      ? 'ribbon-outline'
                      : item.type === 'qualification'
                      ? 'school-outline'
                      : 'camera-outline'
                  }
                  size={12}
                  color={colors.textWhite}
                />
                <Text style={styles.typeText}>{item.label || item.type}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  galleryItem: {
    width: GALLERY_ITEM_SIZE,
    height: GALLERY_ITEM_SIZE * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textWhite,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});

export default memo(TutorGallery);
