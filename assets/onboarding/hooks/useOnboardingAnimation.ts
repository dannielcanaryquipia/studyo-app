import { useSharedValue, useAnimatedStyle, withTiming, runOnJS, withSequence, withDelay } from 'react-native-reanimated';
import { useCallback, useEffect, useRef } from 'react';

export type UseOnboardingAnimationOptions = {
  frameDuration?: number;
  loop?: boolean;
  onComplete?: () => void;
  totalFrames?: number;
};

export type UseOnboardingAnimationReturn = {
  frameIndex: ReturnType<typeof useSharedValue<number>>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  play: () => void;
  pause: () => void;
  reset: () => void;
  goToFrame: (index: number) => void;
};

export function useOnboardingAnimation({
  frameDuration = 33,
  loop = false,
  onComplete,
  totalFrames = 3,
}: UseOnboardingAnimationOptions = {}): UseOnboardingAnimationReturn {
  const frameIndex = useSharedValue(0);
  const isPlaying = useSharedValue(false);
  const animationRef = useRef<number>(0);

  const animate = useCallback(() => {
    if (!isPlaying.value) return;

    const currentFrame = Math.round(frameIndex.value);
    const nextFrame = currentFrame + 1;

    if (nextFrame >= totalFrames) {
      if (loop) {
        frameIndex.value = withDelay(0, withTiming(0, { duration: 0 }));
        runOnJS(animate)();
      } else {
        frameIndex.value = totalFrames - 1;
        isPlaying.value = false;
        if (onComplete) runOnJS(onComplete)();
      }
    } else {
      // Reanimated 4: completion callback lives on the inner withTiming.
      frameIndex.value = withTiming(nextFrame, { duration: frameDuration }, (finished) => {
        if (finished) runOnJS(animate)();
      });
    }
  }, [frameDuration, loop, onComplete, totalFrames]);

  const play = useCallback(() => {
    if (isPlaying.value) return;
    isPlaying.value = true;
    animate();
  }, [animate]);

  const pause = useCallback(() => {
    isPlaying.value = false;
  }, []);

  const reset = useCallback(() => {
    isPlaying.value = false;
    frameIndex.value = 0;
  }, []);

  const goToFrame = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, totalFrames - 1));
    frameIndex.value = clamped;
  }, [totalFrames]);

  const animatedStyle = useAnimatedStyle(() => {
    const current = Math.round(frameIndex.value);
    return {
      opacity: 1,
    };
  });

  useEffect(() => {
    if (isPlaying.value) animate();
  }, [animate]);

  return {
    frameIndex,
    animatedStyle,
    play,
    pause,
    reset,
    goToFrame,
  };
}

export default useOnboardingAnimation;