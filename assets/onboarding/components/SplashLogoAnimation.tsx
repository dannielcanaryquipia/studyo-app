/**
 * SplashLogoAnimation — full 94-frame SVG animation.
 *
 * Frames are stepped from the JS thread via setTimeout so the 396 KB
 * SPLASH_FRAME_PATHS array never enters a Reanimated UI-thread worklet
 * closure. Only the current path string is held in a SharedValue;
 * useAnimatedProps reads it on the UI thread with a tiny closure.
 */
import React, { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { mark, STEPS } from '@/lib/diagnostics';
import { SPLASH_FRAME_PATHS } from '../frame-paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TOTAL_FRAMES = SPLASH_FRAME_PATHS.length; // 94
const FRAME_MS = Math.round(1000 / 30); // ~33 ms @ 30 fps

export type SplashLogoAnimationProps = {
  onComplete?: () => void;
  brandColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const SplashLogoAnimation: React.FC<SplashLogoAnimationProps> = ({
  onComplete,
  brandColor = '#7C3AED',
  style,
}) => {
  const sharedPath = useSharedValue<string>(SPLASH_FRAME_PATHS[0] ?? '');

  /**
   * Held in a ref rather than depended on directly. `onComplete` is rebuilt on
   * every render of the splash screen (it chains back to `useRouter()`, whose
   * identity tracks navigation state). Depending on it would restart the 94
   * frame loop from frame 0 on each of those renders, so the animation could
   * never reach its end and only the 4.5 s safety timer would fire.
   */
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    mark(STEPS.SPLASH_ANIM_START);

    let frame = 0;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (!alive) return;
      frame += 1;
      if (frame >= TOTAL_FRAMES) {
        sharedPath.value = SPLASH_FRAME_PATHS[TOTAL_FRAMES - 1] ?? '';
        onCompleteRef.current?.();
        return;
      }
      sharedPath.value = SPLASH_FRAME_PATHS[frame] ?? '';
      timer = setTimeout(step, FRAME_MS);
    };

    timer = setTimeout(step, FRAME_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [sharedPath]);

  const animatedProps = useAnimatedProps(() => ({
    d: sharedPath.value,
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <Svg
        viewBox="0 0 720 1280"
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <AnimatedPath
          fill={brandColor}
          fillRule="evenodd"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  svg: { width: '100%', height: '100%' },
});

export default SplashLogoAnimation;
