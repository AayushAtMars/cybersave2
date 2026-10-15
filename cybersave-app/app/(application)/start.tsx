import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function StartApplicationRedirect() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

  useEffect(() => {
    // Redirect to service detail if we have a serviceId, otherwise go back
    if (serviceId) {
      router.replace({ pathname: '/services/detail', params: { serviceId } });
    } else {
      router.replace('/(tabs)/services');
    }
  }, [serviceId]);

  return null;
}
