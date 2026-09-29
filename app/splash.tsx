/**
 * app/splash.tsx — opening animation.
 * Plays SplashLogoAnimation then routes:
 *   onboarded → /(tabs), else → /onboarding/welcome
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { mark, STEPS } from '@/lib/diagnostics';
import { getItem } from '@/hooks/useStorage';
import { useTheme } from '@/hooks/useTheme';
import { SplashLogoAnimation } from '@/assets/onboarding/components/SplashLogoAnimation';
import type { Goal } from '@/types/user';

const SAFETY_MS = 4500;
const LIGHT_CANVAS = '#f9f9f9';

mark(STEPS.SPLASH_MODULE);

export default function Splash() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isDark } = useTheme();

  mark(STEPS.SPLASH_RENDER);

  const canvas = isDark ? Colors.dark.background : LIGHT_CANVAS;
  const accent = isDark ? Colors.dark.accent : Colors.light.accent;

  const dest = useRef<'/(tabs)' | '/onboarding/welcome'>('/onboarding/welcome');
  const destReady = useRef(false);
  const launched = useRef(false);
  const animDone = useRef(false);

  const launch = useCallback(() => {
    if (launched.current) return;
    launched.current = true;
    mark(STEPS.SPLASH_LAUNCH);
    router.replace(dest.current);
  }, [router]);

  const handleAnimationComplete = useCallback(() => {
    animDone.current = true;
    mark(STEPS.SPLASH_ANIM_DONE);
    setTimeout(() => {
      if (destReady.current) launch();
    }, 500);
  }, [launch]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getItem<boolean>(STORAGE_KEYS.onboarded),
      getItem<string[]>(STORAGE_KEYS.interests),
      getItem<Goal>(STORAGE_KEYS.goal),
    ]).then(([onboarded, interests, goal]) => {
      if (!alive) return;
      const hasOnboardingData = interests != null && goal != null;
      dest.current = onboarded === true || hasOnboardingData ? '/(tabs)' : '/onboarding/welcome';
      destReady.current = true;
      if (reduceMotion || animDone.current) launch();
    });
    return () => { alive = false; };
  }, [launch, reduceMotion]);

  useEffect(() => {
    const t = setTimeout(launch, SAFETY_MS);
    return () => clearTimeout(t);
  }, [launch]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: canvas }]}>
      <SplashLogoAnimation
        brandColor={accent}
        onComplete={handleAnimationComplete}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
