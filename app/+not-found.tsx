import { useRouter } from 'expo-router';

import { Button, Screen } from '@/src/components/primitives';
import { EmptyState } from '@/src/components/composites';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen title="Not Found">
      <EmptyState
        icon="search-off"
        title="Page not found"
        body="This route doesn't exist. Head back to the home screen."
        action={<Button variant="primary" label="Go Home" onPress={() => router.replace('/(tabs)')} />}
      />
    </Screen>
  );
}
