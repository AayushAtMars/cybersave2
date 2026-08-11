import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DocumentRecord {
  id: string;
  _id?: string; // Support direct Mongoose fallback
  originalName: string;
  sizeBytes: number;
  documentCategory: string;
  verifiedStatus: string;
  createdAt: string;
}

// ── Pre-signed upload flow (rules.md §1, architecture.md §6) ─────────────────
// Step 1: get signed URL
// Step 2: PUT file directly to Supabase (no bytes through our server)
// Step 3: confirm to document-service

export const requestUploadUrl = (payload: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  documentCategory: string;
  applicationId?: string;
}) =>
  apiClient
    .post('/documents/upload-url', payload)
    .then((r) => r.data.data as { uploadUrl: string; token: string; storageKey: string });

export const putFileToStorage = async (
  uploadUrl: string,
  token: string,
  file: DocumentPicker.DocumentPickerAsset
) => {
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, file.uri, {
    httpMethod: 'PUT',
    headers: {
      'Content-Type': file.mimeType ?? 'application/octet-stream',
      'Authorization': `Bearer ${token}`,
    },
    uploadType: FileSystemUploadType.BINARY_CONTENT,
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Supabase Storage upload failed with status code ${uploadResult.status}`);
  }
};

export const confirmUpload = (storageKey: string) =>
  apiClient
    .post('/documents/confirm', { storageKey })
    .then((r) => r.data.data.document as DocumentRecord);

export const getDownloadUrl = (documentId: string) =>
  apiClient
    .get(`/documents/${documentId}/download-url`)
    .then((r) => r.data.data.downloadUrl as string);

export const deleteDocument = (documentId: string) =>
  apiClient
    .delete(`/documents/${documentId}`)
    .then((r) => r.data);

// ── Mutation: full upload pipeline ────────────────────────────────────────────
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      documentCategory,
      applicationId,
    }: {
      file: DocumentPicker.DocumentPickerAsset;
      documentCategory: string;
      applicationId?: string;
    }) => {
      const { uploadUrl, token, storageKey } = await requestUploadUrl({
        fileName: file.name ?? 'upload',
        mimeType: file.mimeType ?? 'application/octet-stream',
        sizeBytes: file.size ?? 0,
        documentCategory,
        applicationId,
      });

      await putFileToStorage(uploadUrl, token, file);
      const document = await confirmUpload(storageKey);
      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDocuments = () =>
  useQuery<DocumentRecord[]>({
    queryKey: ['documents'],
    queryFn: () =>
      apiClient.get('/documents').then((r) => {
        const items = r.data.data.items ?? [];
        return items.map((item: any) => ({
          ...item,
          id: item.id || item._id,
        }));
      }),
  });
