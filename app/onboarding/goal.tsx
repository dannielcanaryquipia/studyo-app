/**
 * Onboarding step 3/3 — Daily goal.
 * Route: /onboarding/goal
 */
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GOAL_MINUTES } from '@/lib/onboarding';
import { setItem } from '@/hooks/useStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { Button, PageIndicator, useThemeColor } from '@/src/components/primitives';
import { useResponsive } from '@/hooks/useResponsive';
import type { Goal } from '@/types/user';

const GOAL_OPTIONS: { key: Goal; label: string; description: string }[] = [
  { key: 'casual', label: 'Casual', description: `${GOAL_MINUTES.casual} min / day — learn at a relaxed pace` },
  { key: 'regular', label: 'Regular', description: `${GOAL_MINUTES.regular} min / day — build a strong habit` },
  { key: 'intensive', label: 'Intensive', description: `${GOAL_MINUTES.intensive} min / day — immerse fully` },
];

export default function GoalScreen() {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const { hPad, contentMaxWidth, headingSize, bodySize } = useResponsive();
  const insets = useSafeAreaInsets();

  const background = useThemeColor('background');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  const handleContinue = useCallback(async () => {
    if (!goal) return;
    await setItem(STORAGE_KEYS.goal, goal);
    await setItem(STORAGE_KEYS.onboarded, true);
    router.replace('/(tabs)');
  }, [goal, router]);

  return (
    <View style={[s.root, { backgroundColor: background, paddingHorizontal: hPad }]}>
      <View style={{
        maxWidth: contentMaxWidth,
        alignSelf: 'center',
        width: '100%',
        flex: 1,
        // top: clear status bar + notch; bottom: clear gesture bar
        paddingTop: insets.top + 24,
        paddingBottom: Math.max(insets.bottom, 16) + 16,
      }}>
        {/* Title */}
        <View style={{ gap: 12, marginBottom: 32 }}>
          <Text style={[s.title, { color: text, fontSize: headingSize }]}>Set your daily goal</Text>
          <Text style={[s.subtitle, { color: muted, fontSize: bodySize }]}>
            How much time do you want to spend learning each day?
          </Text>
        </View>

        {/* Goal options */}
        <View style={{ gap: 12 }}>
          {GOAL_OPTIONS.map((option) => {
            const active = goal === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setGoal(option.key)}
                style={[
                  s.optionCard,
                  {
                    borderColor: active ? accent : border,
                    backgroundColor: active ? `${accent}33` : surface,
                  },
                ]}>
                {/* Radio circle */}
                <View style={[s.radio, { borderColor: active ? accent : border }]}>
                  {active && <View style={[s.radioDot, { backgroundColor: accent }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionLabel, { color: active ? accent : text }]}>{option.label}</Text>
                  <Text style={[s.optionDesc, { color: muted, fontSize: bodySize }]}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <PageIndicator total={3} current={2} />
          <Button variant="primary" label="Start Learning" disabled={!goal} onPress={handleContinue} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  title: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    minHeight: 44,
  },
  radio: { height: 24, width: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot: { height: 12, width: 12, borderRadius: 6 },
  optionLabel: { fontFamily: 'SpaceMono_700Bold', fontSize: 18 },
  optionDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 2 },
  footer: { marginTop: 'auto', gap: 16, paddingTop: 24 },
});
