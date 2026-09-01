import { createClient } from '@supabase/supabase-js';
import { config } from '../../../config';

const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export const BUCKET = config.supabaseStorageBucket;
export const DOWNLOAD_TTL = config.downloadUrlTtlSeconds;

export const getUploadUrl = async (
  storageKey: string
): Promise<{ signedUrl: string; token: string }> => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storageKey);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }
  
  const signedUrl = data.signedUrl.startsWith('http') 
    ? data.signedUrl 
    : `${config.supabaseUrl}${data.signedUrl}`;
    
  return { ...data, signedUrl };
};

export const getDownloadUrl = async (storageKey: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, DOWNLOAD_TTL);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create download URL: ${error?.message}`);
  }
  return data.signedUrl;
};

export const deleteFile = async (storageKey: string): Promise<void> => {
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey]);
  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
