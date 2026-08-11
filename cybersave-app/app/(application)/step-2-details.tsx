// Step 2 is now merged into Step 1 (personal + service-specific fields).
// This shim redirects automatically if somehow navigated to directly.
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Step2DetailsRedirect() {
  useEffect(() => {
    // Redirect to documents which is now the true Step 2
    router.replace('/(application)/step-3-documents');
  }, []);
  return null;
}
