const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.storage.from('cybersave-documents').createSignedUploadUrl('test.png').then(res => console.log('DATA:', res.data));
