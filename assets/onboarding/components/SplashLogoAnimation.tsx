/**
 * SplashLogoAnimation — full 94-frame SVG animation.
 *
 * The frames are stepped on the JS thread by a plain timer and rendered through
 * React state. That is a deliberate reversal of the previous implementation,
 * which drove `d` through Reanimated's `useAnimatedProps`.
 *
 * Why: `useAnimatedProps` on a react-native-svg `Path` does not reliably
 * repaint per frame under Fabric (New Architecture) — see react-native-svg#2962,
 * where a `useAnimatedProps` prop stays at its initial value for the whole
 * animation and snaps only at the end, while a sibling `useAnimatedStyle` on the
 * same SharedValue animates correctly. The symptom in a release build is exactly
 * what was reported: the splash ran for its full duration and then routed on,
 * but the logo was never actually drawn.
 *
 * Reanimated also bought nothing here. The frame loop was already JS-driven via
 * setTimeout, so the 396 KB path array could never live on the UI thread anyway;
 * the only thing the SharedValue added was a dependency on Fabric prop
 * repainting. Re-rendering one `<Path>` 94 times across 3.1 s is free.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { mark, STEPS } from '@/lib/diagnostics';
import { SPLASH_FRAME_PATHS } from '../frame-paths';

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
  const [frame, setFrame] = useState(0);

  /**
   * Held in a ref rather than depended on directly. `onComplete` is rebuilt on
   * every render of the splash screen (it chains back to `useRouter()`, whose
   * identity tracks navigation state). Depending on it would restart the 94
   * frame loop from frame 0 on each of those renders, so the animation could
   * never reach its end and only the splash safety timer would fire.
   */
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    mark(STEPS.SPLASH_ANIM_START);

    let index = 0;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (!alive) return;
      index += 1;
      if (index >= TOTAL_FRAMES) {
        setFrame(TOTAL_FRAMES - 1);
        onCompleteRef.current?.();
        return;
      }
      setFrame(index);
      timer = setTimeout(step, FRAME_MS);
    };

    timer = setTimeout(step, FRAME_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Svg
        viewBox="0 0 720 1280"
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <Path
          fill={brandColor}
          fillRule="evenodd"
          d={SPLASH_FRAME_PATHS[frame] ?? ''}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  svg: { width: '100%', height: '100%' },
});

export default SplashLogoAnimation;
