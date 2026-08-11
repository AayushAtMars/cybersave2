import { Stack } from 'expo-router';

export default function ApplicationLayout() {
  return (
    <Stack
      screenOptions={{
        // Each step renders its own branded gradient header with progress
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
