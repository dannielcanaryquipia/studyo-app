/**
 * src/components/SplashOverlay.tsx — the opening animation, as an overlay.
 *
 * Splash used to be a router route (`app/splash.tsx`) reached via
 * `unstable_settings.initialRouteName = 'splash'`. That was the release bug: the
 * cold-start URL is `/`, which resolves to `(tabs)/index` (home), NOT `/splash`.
 * `initialRouteName` only sets the stack *anchor*, not the screen that loads — so
 * in a release APK home rendered in front, `/splash` mounted underneath as the
 * anchor, ran its timer invisibly, and fired `router.replace('/(tabs)')` at the
 * end, resetting whatever route the user had navigated to. In Expo Go the dev
 * launch URL and slower bundle load masked the ordering.
 *
 * As an overlay it can have neither failure. It renders on top of the navigator
 * from the first frame, so the animation is actually seen. It owns no route, and
 * for the common (already-onboarded) path it fires no navigation at all — home is
 * already the loaded route, so it simply lifts the overlay. The only navigation
 * it ever does is a single redirect into onboarding on a first launch, and that
 * happens *under* the overlay, so there is no visible jump and nothing left to
 * reset the user's routing later.
 *
 * Keeps the existing SVG frame animation (`SplashLogoAnimation`) unchanged — no
 * new dependency.
 */
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { mark, STEPS } from '@/lib/diagnostics';
import { readOnboardingState, resolveLaunchDestination } from '@/lib/onboarding-state';
import { useTheme } from '@/hooks/useTheme';
import { SplashLogoAnimation } from '@/assets/onboarding/components/SplashLogoAnimation';
import type { LaunchDestination } from '@/lib/onboarding-state';

/** Ceiling: dismiss no later than this, even if the frame loop stalls. */
const SAFETY_MS = 4500;
/** Floor: never dismiss before the animation has had time to be seen. */
const MIN_VISIBLE_MS = 1200;
/** Beat between the last frame and the dismiss, so the final frame registers. */
const SETTLE_MS = 500;
const LIGHT_CANVAS = '#f9f9f9';

export function SplashOverlay() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isDark } = useTheme();

  const [visible, setVisible] = useState(true);

  const canvas = isDark ? Colors.dark.background : LIGHT_CANVAS;
  const accent = isDark ? Colors.dark.accent : Colors.light.accent;

  const dest = useRef<LaunchDestination>('/(tabs)');
  const destReady = useRef(false);
  const finished = useRef(false);
  const animDone = useRef(false);
  const mountedAt = useRef(0);
  const nativeHidden = useRef(false);
  const floorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drop the native splash the instant the overlay's first frame is laid out, so
  // what the native splash hands off to is the animation, not home. onLayout of
  // *this* view is the right signal: it fires once the overlay is measured and
  // about to paint.
  const handleLayout = useCallback(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    mark(STEPS.SPLASH_HANDOFF);
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (floorTimer.current !== null) {
      clearTimeout(floorTimer.current);
      floorTimer.current = null;
    }
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    mark(STEPS.SPLASH_LAUNCH);
    // Home (`/`) is already the loaded route, so the onboarded path navigates
    // nowhere — it just lifts the overlay. Only a first launch redirects.
    if (dest.current !== '/(tabs)') router.replace(dest.current);
    setVisible(false);
  }, [router]);

  const launch = useCallback(() => {
    if (finished.current || floorTimer.current !== null) return;
    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (wait > 0) {
      floorTimer.current = setTimeout(() => {
        floorTimer.current = null;
        if (!finished.current) finish();
      }, wait);
      return;
    }
    finish();
  }, [finish]);

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
    mountedAt.current = Date.now();
    mark(STEPS.SPLASH_RENDER);
  }, []);

  useEffect(() => {
    let alive = true;
    readOnboardingState().then((state) => {
      if (!alive) return;
      dest.current = resolveLaunchDestination(state);
      destReady.current = true;
      if (reduceMotion || animDone.current) launch();
    });
    return () => {
      alive = false;
    };
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

  if (!visible) return null;

  return (
    // Fills the screen above the navigator and swallows touches so the home
    // screen mounting underneath cannot be interacted with while the splash runs.
    <View
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: canvas }]}
      onLayout={handleLayout}>
      <SplashLogoAnimation
        brandColor={accent}
        onComplete={handleAnimationComplete}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    // Under CrashOverlay (9999) so a startup crash report still wins, above
    // everything else.
    zIndex: 9998,
    elevation: 9998,
  },
});

export default SplashOverlay;
