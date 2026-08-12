/**
 * This screen has been removed from the flow.
 * The intermediate "Start Application" screen is no longer needed.
 * "Apply Now" on the Service Detail screen directly creates the application
 * and navigates to step-1-personal.
 *
 * This file acts as a safety redirect in case any deep-link or legacy
 * navigation still points here.
 */
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
