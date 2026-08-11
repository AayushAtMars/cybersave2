import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  port: parseInt(process.env.PORT ?? '3002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  mongoUriApplication: required('MONGO_URI_APPLICATION'),
  mongoUriDocument: required('MONGO_URI_DOCUMENT'),
  mongoUriPayment: required('MONGO_URI_PAYMENT'),

  supabaseUrl: required('SUPABASE_URL'),
  supabaseKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'cybersave-documents',
  downloadUrlTtlSeconds: parseInt(process.env.DOWNLOAD_URL_TTL_SECONDS ?? '300', 10),

  razorpayKeyId: required('RAZORPAY_KEY_ID'),
  razorpayKeySecret: required('RAZORPAY_KEY_SECRET'),
  razorpayWebhookSecret: required('RAZORPAY_WEBHOOK_SECRET'),

  coreServiceUrl: required('CORE_SERVICE_URL'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
  cronSecret: process.env.CRON_SECRET ?? 'secret',
};
