import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Cache for Google's public certificates to avoid fetching on every request
let googlePublicKeysCache: Record<string, string> | null = null;
let cacheExpiry = 0;

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system%40system.gserviceaccount.com';
const PROJECT_ID = 'cybersave-625ad';
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;

// Fetch Google's public keys for Firebase ID token validation.

const getGooglePublicKeys = async (): Promise<Record<string, string>> => {
  const now = Date.now();
  if (googlePublicKeysCache && now < cacheExpiry) {
    return googlePublicKeysCache;
  }

  try {
    const res = await fetch(GOOGLE_CERTS_URL);
    const data = await res.json() as Record<string, string>;
    googlePublicKeysCache = data;
    // Cache for 6 hours
    cacheExpiry = now + 6 * 60 * 60 * 1000;
    return data;
  } catch (err) {
    logger.error('Failed to fetch Google public keys for Firebase token verification', { error: err });
    throw new Error('Verification service currently unavailable');
  }
};

interface FirebaseIdTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  phone_number?: string;
  exp: number;
}

/**
 * Verifies a Firebase ID token.
 * Returns the verified phone number.
 */
export const verifyFirebaseToken = async (token: string, expectedPhone: string): Promise<boolean> => {
  try {
    // 1. Decode token header to find Key ID (kid)
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
      logger.warn('Firebase token verification failed: invalid header structure');
      return false;
    }

    const kid = decodedHeader.header.kid;
    const publicKeys = await getGooglePublicKeys();
    const cert = publicKeys[kid];

    if (!cert) {
      logger.warn('Firebase token verification failed: public key not found for kid', { kid });
      return false;
    }

    // 2. Verify signature and standard claims
    const payload = jwt.verify(cert, cert, {
      algorithms: ['RS256'],
    }) as unknown as FirebaseIdTokenPayload;

    // Use jwt.verify with the certificate to decode and verify the token signature
    const verifiedPayload = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: PROJECT_ID,
      issuer: ISSUER,
    }) as FirebaseIdTokenPayload;

    // 3. Normalize and match phone numbers
    // Expected phone from frontend might be e.g. "6284046869" or "+916284046869"
    // Firebase phone is always international format e.g. "+916284046869"
    const firebasePhone = verifiedPayload.phone_number;
    if (!firebasePhone) {
      logger.warn('Firebase token verification failed: missing phone number in token');
      return false;
    }

    const cleanExpected = expectedPhone.replace(/\D/g, '');
    const cleanFirebase = firebasePhone.replace(/\D/g, '');

    // Allow match if expected is a suffix (e.g. 6284046869 matches 916284046869)
    if (cleanFirebase.endsWith(cleanExpected)) {
      return true;
    }

    logger.warn('Firebase token verification failed: phone number mismatch', {
      expected: expectedPhone,
      received: firebasePhone,
    });
    return false;
  } catch (err) {
    logger.warn('Firebase token verification threw error', { error: err });
    return false;
  }
};
