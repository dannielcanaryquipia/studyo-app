/**
 * Onboarding step 1/3 — Welcome.
 * Route: /onboarding/welcome  (entry from splash when not onboarded)
 */
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/constants/storage-keys';
import { setItem } from '@/hooks/useStorage';
import { Button, PageIndicator, useThemeColor } from '@/src/components/primitives';
import StudyoLogo from '@/src/components/StudyoLogo';
import { useResponsive } from '@/hooks/useResponsive';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, hPad, isTablet, headingSize, bodySize, contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const background = useThemeColor('background');
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  const handleGetStarted = useCallback(() => {
    router.push('/onboarding/interests');
  }, [router]);

  const handleSkip = useCallback(async () => {
    await setItem(STORAGE_KEYS.onboarded, true);
    router.replace('/(tabs)');
  }, [router]);

  const logoSize = Math.min(isTablet ? 240 : 192, width * 0.48);

  // Dynamic top offset: status bar + a small gap so Skip button doesn't overlap the notch/island
  const topOffset = insets.top + 8;

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      {/* Skip button — sits just below status bar */}
      <View style={[s.skipRow, { paddingHorizontal: hPad, top: topOffset }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          onPress={handleSkip}
          style={s.skipBtn}>
          <Text style={[s.skipText, { color: accent }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Hero — centered with max-width on tablet */}
      <View style={[
        s.hero,
        {
          paddingHorizontal: hPad,
          paddingTop: topOffset + 56, // clear the skip button
          paddingBottom: insets.bottom + 96,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        },
      ]}>
        <View style={{ width: logoSize, height: logoSize, marginBottom: 40, alignItems: 'center', justifyContent: 'center' }}>
          <StudyoLogo size={logoSize} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={[s.title, { fontSize: headingSize, color: text }]}>Learn without limits</Text>
          <Text style={[s.body, { maxWidth: 360, fontSize: bodySize + 2, color: muted }]}>
            Track your progress, build streaks, and master new skills with a personalized learning journey.
          </Text>
        </View>
      </View>

      {/* Footer — page dots + CTA; sits above gesture bar */}
      <View style={[
        s.footer,
        {
          paddingHorizontal: hPad,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
          maxWidth: contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        },
      ]}>
        <PageIndicator total={3} current={0} />
        <Button variant="primary" size="lg" label="Get Started" onPress={handleGetStarted} style={s.cta} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  skipRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  skipBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  skipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'SpaceMono_700Bold', fontSize: 24, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, textAlign: 'center' },
  footer: { width: '100%', alignItems: 'center', gap: 24 },
  cta: { width: '100%', height: 56 },
});
