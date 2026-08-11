/**
 * Firebase Auth — lazy wrapper for the v26 modular API
 *
 * @react-native-firebase v26 uses the modular (tree-shakeable) API:
 *   - `getAuth(app?)` → returns the Auth instance
 *   - `signInWithPhoneNumber(auth, phone)` → sends SMS OTP
 *
 * This module resolves lazily so the rest of the app loads safely
 * when the native module is unavailable (Expo Go, bridge not ready, etc.)
 * and falls back to the backend mock-OTP path.
 */

let _getAuth: ((app?: any) => any) | null = null;
let _signInWithPhoneNumber: ((auth: any, phone: string) => Promise<any>) | null = null;
let _resolved = false;

function resolveFirebase(): boolean {
  if (_resolved) return _getAuth !== null;
  _resolved = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-firebase/auth');
    _getAuth = mod.getAuth ?? null;
    _signInWithPhoneNumber = mod.signInWithPhoneNumber ?? null;
    if (!_getAuth || !_signInWithPhoneNumber) {
      console.warn('[Firebase] Module loaded but getAuth/signInWithPhoneNumber not found. Keys:', Object.keys(mod).join(', '));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Firebase] Native auth module unavailable:', (e as Error).message);
    return false;
  }
}

/**
 * Send an OTP to the given phone number (E.164 format, e.g. "+919876543210").
 * Returns the ConfirmationResult on success, or null if Firebase is unavailable.
 */
export async function sendFirebaseOtp(phoneNumber: string): Promise<any | null> {
  if (!resolveFirebase()) return null;
  try {
    const authInstance = _getAuth!();
    return await _signInWithPhoneNumber!(authInstance, phoneNumber);
  } catch (e) {
    // Re-throw so callers can fall back to backend OTP
    throw e;
  }
}

// ── Active confirmation (Firebase phone-auth session) ──────────────────────────

let activeConfirmation: any = null;

export const setActiveConfirmation = (conf: any) => {
  activeConfirmation = conf;
};

export const getActiveConfirmation = () => activeConfirmation;
