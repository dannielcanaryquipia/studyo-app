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
import { mark, STEPS } from '@/lib/diagnostics';
import { signalSplashPainted } from '@/lib/splash-gate';
import { readOnboardingState, resolveLaunchDestination } from '@/lib/onboarding-state';
import { useTheme } from '@/hooks/useTheme';
import { SplashLogoAnimation } from '@/assets/onboarding/components/SplashLogoAnimation';
import type { LaunchDestination } from '@/lib/onboarding-state';

/** Ceiling: never outlive this, even if the frame loop stalls. */
const SAFETY_MS = 4500;
/**
 * Floor: never navigate away before the animation has had time to be seen.
 *
 * This is the guard against the release-APK failure. In Expo Go the JS bundle
 * download dominates startup, so the native splash is still up while the
 * animation plays and the flow always looks right. In an APK the bundle is
 * already resident and the AsyncStorage reads resolve in single-digit
 * milliseconds — often before the first frame is committed. SAFETY_MS is a
 * ceiling and does nothing about that: `launch()` could fire in the same frame
 * this screen mounted, and the animation would never be seen.
 */
const MIN_VISIBLE_MS = 1200;
/** Beat between the last frame and the navigate, so the final frame registers. */
const SETTLE_MS = 500;
const LIGHT_CANVAS = '#f9f9f9';

mark(STEPS.SPLASH_MODULE);

export default function Splash() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isDark } = useTheme();

  mark(STEPS.SPLASH_RENDER);

  const canvas = isDark ? Colors.dark.background : LIGHT_CANVAS;
  const accent = isDark ? Colors.dark.accent : Colors.light.accent;

  const dest = useRef<LaunchDestination>('/onboarding/welcome');
  const destReady = useRef(false);
  const launched = useRef(false);
  const animDone = useRef(false);
  const mountedAt = useRef(0);
  const floorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Report that the animated splash is on screen so the root layout can drop
  // the native splash. Deliberately on mount and independent of the animation
  // and the onboarding lookup — the only claim is "something painted here".
  // Declared first so mountedAt is set before any other effect can call launch.
  useEffect(() => {
    mountedAt.current = Date.now();
    signalSplashPainted();
  }, []);

  const go = useCallback(() => {
    launched.current = true;
    mark(STEPS.SPLASH_LAUNCH);
    router.replace(dest.current);
  }, [router]);

  const launch = useCallback(() => {
    if (launched.current || floorTimer.current !== null) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (wait > 0) {
      floorTimer.current = setTimeout(() => {
        floorTimer.current = null;
        if (!launched.current) go();
      }, wait);
      return;
    }
    go();
  }, [go]);

  const handleAnimationComplete = useCallback(() => {
    animDone.current = true;
    mark(STEPS.SPLASH_ANIM_DONE);
    if (settleTimer.current !== null) return;
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      if (destReady.current) launch();
    }, SETTLE_MS);
  }, [launch]);

  useEffect(() => {
    let alive = true;
    readOnboardingState().then((state) => {
      if (!alive) return;
      dest.current = resolveLaunchDestination(state);
      destReady.current = true;
      if (reduceMotion || animDone.current) launch();
    });
    return () => { alive = false; };
  }, [launch, reduceMotion]);

  useEffect(() => {
    const t = setTimeout(launch, SAFETY_MS);
    return () => clearTimeout(t);
  }, [launch]);

  useEffect(() => {
    return () => {
      if (floorTimer.current !== null) clearTimeout(floorTimer.current);
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    };
  }, []);

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
