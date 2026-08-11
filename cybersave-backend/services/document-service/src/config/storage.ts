import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'cybersave-documents';
export const DOWNLOAD_TTL = parseInt(process.env.DOWNLOAD_URL_TTL_SECONDS ?? '300', 10);

/**
 * Generate a pre-signed upload URL for the client to PUT directly to Supabase.
 * The client NEVER sends file bytes through our API server (rules.md §1, architecture.md §6).
 */
export const getUploadUrl = async (
  storageKey: string
): Promise<{ signedUrl: string; token: string }> => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storageKey);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }
  return data;
};

/**
 * Generate a short-lived download URL after an auth check.
 * URL expires in DOWNLOAD_TTL seconds (default 5 minutes).
 */
export const getDownloadUrl = async (storageKey: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, DOWNLOAD_TTL);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create download URL: ${error?.message}`);
  }
  return data.signedUrl;
};

/**
 * Delete a file from storage (called during retention cleanup or document deletion).
 */
export const deleteFile = async (storageKey: string): Promise<void> => {
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
