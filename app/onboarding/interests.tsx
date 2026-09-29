/**
 * Onboarding step 2/3 — Interests.
 * Route: /onboarding/interests
 */
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildInterestTopics } from '@/src/data/categories';
import { courses } from '@/src/data/courses';
import { canContinueInterests } from '@/lib/onboarding';
import { setItem } from '@/hooks/useStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { CategoryChips } from '@/src/components/composites';
import type { CategoryChipItem } from '@/src/components/composites';
import { Button, Icon, PageIndicator, useThemeColor } from '@/src/components/primitives';
import { useResponsive } from '@/hooks/useResponsive';

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { hPad, contentMaxWidth, headingSize, bodySize } = useResponsive();
  const insets = useSafeAreaInsets();
  const background = useThemeColor('background');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  const topics = useMemo(() => buildInterestTopics(courses), []);
  const categories: CategoryChipItem[] = useMemo(
    () => topics.map((c) => ({ ...c, selected: selected.has(c.id) })),
    [topics, selected],
  );

  const canProceed = useMemo(() => canContinueInterests([...selected]), [selected]);

  const handleToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const persistAndContinue = useCallback(async () => {
    await setItem(STORAGE_KEYS.interests, [...selected]);
    router.push('/onboarding/goal');
  }, [selected, router]);

  const topPad = insets.top + 8;
  const botPad = Math.max(insets.bottom, 16) + 8;

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      {/* Back header — clears status bar */}
      <View style={[
        s.header,
        { paddingHorizontal: hPad, paddingTop: topPad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
      ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={s.backBtn}>
          <Icon name="arrow-back" size={22} />
        </Pressable>
      </View>

      <View style={[
        s.body,
        { paddingHorizontal: hPad, paddingBottom: botPad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
      ]}>
        {/* Title */}
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Text style={[s.title, { color: text, fontSize: headingSize }]}>What do you want to learn?</Text>
          <Text style={[s.subtitle, { color: muted, fontSize: bodySize }]}>
            Select at least 3 topics to personalize your experience
          </Text>
        </View>

        {/* Chips scroll area */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <CategoryChips categories={categories} onToggle={handleToggle} grid />
          <Text style={[s.counter, { color: muted, fontSize: bodySize }]}>
            {selected.size} of {topics.length} selected
          </Text>
        </ScrollView>

        {/* Footer */}
        <View style={{ gap: 16, paddingTop: 8 }}>
          <PageIndicator total={3} current={1} />
          <Button variant="primary" label="Continue" disabled={!canProceed} onPress={persistAndContinue} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  backBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  counter: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 16 },
});
