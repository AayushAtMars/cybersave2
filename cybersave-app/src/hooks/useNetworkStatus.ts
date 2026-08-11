/**
 * useNetworkStatus
 * Returns { isConnected, isChecking } — monitors real network connectivity.
 * Falls back gracefully if NetInfo is unavailable.
 */
import { useState, useEffect } from 'react';

let NetInfo: any = null;
try {
  // Dynamic import so the app doesn't crash if the module isn't linked yet
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  NetInfo = null;
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!NetInfo) {
      // If module not available, assume connected
      setIsConnected(true);
      setIsChecking(false);
      return;
    }

    // Fetch current state immediately
    NetInfo.fetch().then((state: any) => {
      setIsConnected(state.isConnected);
      setIsChecking(false);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsConnected(state.isConnected);
      setIsChecking(false);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isChecking };
}
