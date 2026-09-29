import { useRouter } from 'expo-router';

import { Button, Screen } from '@/src/components/primitives';

export default function ModalScreen() {
  const router = useRouter();
  return (
    <Screen title="Modal" onBack={() => router.back()}>
      <Button variant="secondary" label="Close" onPress={() => router.back()} />
    </Screen>
  );
}
