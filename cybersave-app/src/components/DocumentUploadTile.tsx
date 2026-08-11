import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, radius, shadows } from '../theme';

interface UploadedFile {
  id?: string;         // documentId after server confirm
  name: string;
  sizeBytes: number;
  uploading?: boolean;
  error?: string;
}

interface DocumentUploadTileProps {
  label: string;
  description?: string;
  mandatory?: boolean;
  acceptedFormats?: string[];
  maxSizeMb?: number;
  file?: UploadedFile;
  onPick: (file: DocumentPicker.DocumentPickerAsset) => void;
  onRemove?: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentUploadTile: React.FC<DocumentUploadTileProps> = ({
  label,
  description,
  mandatory = true,
  acceptedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
  maxSizeMb = 5,
  file,
  onPick,
  onRemove,
}) => {
  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: acceptedFormats.flatMap((f) =>
        f === 'pdf' ? ['application/pdf'] : [`image/${f}`]
      ),
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.size && asset.size > maxSizeMb * 1024 * 1024) {
        alert(`File too large. Maximum allowed: ${maxSizeMb} MB`);
        return;
      }
      onPick(asset);
    }
  };

  const isUploaded = !!file?.id;
  const isUploading = file?.uploading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
          {mandatory && <Text style={styles.required}> *</Text>}
        </Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {file && !file.error ? (
        // Uploaded state
        <View style={[styles.tile, isUploaded && styles.tileUploaded]}>
          <View style={styles.fileInfo}>
            <View style={styles.fileIcon}>
              <Text style={styles.fileIconText}>📄</Text>
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileSize}>{formatBytes(file.sizeBytes)}</Text>
            </View>
          </View>
          {isUploading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={12}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Empty / pick state
        <TouchableOpacity style={styles.uploadArea} onPress={handlePick} activeOpacity={0.7}>
          <Text style={styles.uploadIcon}>⬆</Text>
          <Text style={styles.uploadText}>
            Tap to upload{'\n'}
            <Text style={styles.uploadMeta}>
              {acceptedFormats.join(', ').toUpperCase()} · Max {maxSizeMb} MB
            </Text>
          </Text>
        </TouchableOpacity>
      )}

      {file?.error && (
        <Text style={styles.errorText}>{file.error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: { gap: 2 },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semiBold,
    color: colors.textPrimary,
  },
  required: { color: colors.status.error },
  description: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tileUploaded: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.successBg,
  },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: { fontSize: 18 },
  fileMeta: { flex: 1 },
  fileName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  fileSize: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.status.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: colors.status.error, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  uploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryGhost,
  },
  uploadIcon: { fontSize: 20 },
  uploadText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  uploadMeta: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.regular,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
});
