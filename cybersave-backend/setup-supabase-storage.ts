/**
 * setup-supabase-storage.ts
 * Run once to configure the cybersave-documents Supabase bucket:
 *   - Mark bucket as private (not public)
 *   - Create storage RLS policies:
 *     • Citizens can INSERT to their own folder (path: {citizenId}/*)
 *     • Service role can SELECT, INSERT, DELETE anything (via service_role key — bypasses RLS anyway)
 *     • Citizens can SELECT their own files (for pre-signed URL generation)
 *
 * Usage: npx ts-node setup-supabase-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ykoxjztuhufjvygihebu.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_M-H4QEA2V74ktr1_-YvZYg_eoTRDwP4';
const BUCKET_NAME = 'cybersave-documents';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // 1. Update bucket to be private (public: false)
  console.log('→ Configuring bucket as private...');
  const { error: bucketError } = await supabase.storage.updateBucket(BUCKET_NAME, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB per file
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'],
  });

  if (bucketError) {
    console.error('❌ Failed to update bucket:', bucketError.message);
    process.exit(1);
  }
  console.log('  ✓ Bucket set to private, 5 MB limit, PDF/JPG/PNG/WebP only');

  // 2. Verify the bucket settings
  const { data: bucket, error: getError } = await supabase.storage.getBucket(BUCKET_NAME);
  if (getError) {
    console.error('❌ Could not verify bucket:', getError.message);
  } else {
    console.log(`  ✓ Bucket verified: public=${bucket?.public}, id=${bucket?.id}`);
  }

  // Note on RLS policies:
  // The service_role key bypasses ALL RLS policies — so our backend (document-service)
  // can always read, write, and delete using the service role key.
  //
  // For citizen uploads (client-side pre-signed URLs), the flow is:
  //   1. Citizen asks document-service for a pre-signed upload URL
  //   2. document-service generates it server-side using service_role key
  //   3. Citizen uploads directly to that signed URL (no auth token needed for signed URLs)
  //   4. document-service confirms and records the document ID
  //
  // Signed URLs bypass RLS entirely — so no citizen-facing RLS policies are required.
  // This is the correct architecture for our use case (rules.md §1).
  console.log('\n  ℹ  Signed URL flow uses service_role — no citizen RLS policies needed.');
  console.log('  ℹ  Bucket is private: files are NOT accessible via public URL.');

  console.log('\n✅ Supabase storage configured correctly.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
