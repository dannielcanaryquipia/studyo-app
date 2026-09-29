/**
 * src/components/tab-bar.tsx — Layer-3 custom bottom TabBar, StyleSheet-only.
 */
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon, useThemeColor } from '@/src/components/primitives';
import type { MaterialIconName } from '@/types/course';

type BottomTabBarProps = {
  state: { routes: { name: string }[]; index: number };
  navigation: { navigate: (name: string) => void };
};

type TabConfig = { key: string; label: string; icon: MaterialIconName };

const TABS: TabConfig[] = [
  { key: 'index', label: 'Home', icon: 'home' },
  { key: 'courses', label: 'Courses', icon: 'school' },
  { key: 'progress', label: 'Progress', icon: 'leaderboard' },
  { key: 'profile', label: 'Profile', icon: 'person' },
];

const TWEEN_MS = 150;
const withAlpha = (hex: string, alpha: string) => `${hex}${alpha}`;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;
  const background = useThemeColor('background');
  const border = useThemeColor('border');

  return (
    <View
      style={[
        tb.bar,
        {
          borderColor: border,
          backgroundColor: background,
          // bottom: gesture bar / home indicator on all phones
          paddingBottom: Math.max(insets.bottom, 8),
          // left/right: handles notch or rounded corners in landscape mode
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.key;
        return (
          <TabItem
            key={tab.key}
            config={tab}
            isActive={isActive}
            onPress={() => { if (!isActive) navigation.navigate(tab.key); }}
          />
        );
      })}
    </View>
  );
}

function TabItem({ config, isActive, onPress }: { config: TabConfig; isActive: boolean; onPress: () => void }) {
  const progress = useSharedValue(isActive ? 1 : 0);
  const accent = useThemeColor('accent');
  const tabDefault = useThemeColor('tabDefault');
  const primaryFixed = useThemeColor('primaryFixed');

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: TWEEN_MS });
  }, [isActive, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [withAlpha(primaryFixed, '00'), primaryFixed]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.85, 1]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [tabDefault, accent]),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={config.label}
      onPress={onPress}
      style={tb.tabItem}>
      <View style={tb.pillWrap}>
        <Animated.View style={[tb.pill, pillStyle]} />
        <Icon name={config.icon} size={24} color={isActive ? accent : tabDefault} />
      </View>
      <Animated.Text style={[tb.tabLabel, labelStyle]}>
        {config.label}
      </Animated.Text>
    </Pressable>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    minHeight: 56,
  },
  tabItem: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pillWrap: {
    position: 'relative',
    height: 32,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
