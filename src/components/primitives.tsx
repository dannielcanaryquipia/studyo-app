/**
 * src/components/primitives.tsx — Layer-1 primitives, StyleSheet-only (no NativeWind).
 * Colors come from useThemeColor(). Responsive sizing via useWindowDimensions().
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import Colors from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import StudyoLogo from '@/src/components/StudyoLogo';
import type { MaterialIconName } from '@/types/course';

// --- theme -------------------------------------------------------------------

export function useThemeColor(colorName: keyof typeof Colors.light): string {
  const { isDark } = useTheme();
  return isDark ? Colors.dark[colorName] : Colors.light[colorName];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const clamp100 = (n: number) => Math.min(100, Math.max(0, n));

function usePressed() {
  const [pressed, setPressed] = useState(false);
  return {
    pressProps: {
      onPressIn: () => setPressed(true),
      onPressOut: () => setPressed(false),
    },
    pressStyle: pressed ? ({ transform: [{ scale: 0.95 }], opacity: 0.9 } as const) : undefined,
  };
}

// --- Icon --------------------------------------------------------------------

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: MaterialIconName;
  size?: number;
  color?: string;
  variant?: 'outlined' | 'filled';
  style?: ComponentProps<typeof MaterialIcons>['style'];
}) {
  const text = useThemeColor('text');
  return <MaterialIcons name={name} size={size} color={color ?? text} style={style} />;
}

// --- Screen ------------------------------------------------------------------

export function Screen({
  title,
  onBack,
  right,
  showLogo = false,
  scroll = true,
  progress,
  children,
  contentContainerStyle,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  showLogo?: boolean;
  scroll?: boolean;
  progress?: number;
  children: ReactNode;
  contentContainerStyle?: object;
}) {
  const background = useThemeColor('background');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const { hPad, gap, contentMaxWidth, isTablet } = useResponsive();
  // Device-level insets: top = status bar/notch, bottom = home indicator/gesture bar
  const insets = useSafeAreaInsets();

  const headerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: hPad,
    minHeight: 52,
    alignSelf: 'center' as const,
    width: '100%' as const,
    maxWidth: contentMaxWidth,
  };

  const contentStyle = {
    padding: hPad,
    // Always include the bottom inset so scroll content never hides behind
    // the gesture bar (home indicator) or nav buttons. On tab screens the
    // extra space is minor; on full-screen subpages it's essential.
    paddingBottom: hPad + 16 + insets.bottom,
    gap,
    alignSelf: 'center' as const,
    width: '100%' as const,
    maxWidth: contentMaxWidth,
  };

  return (
    <View style={[s.screenRoot, { backgroundColor: background }]}>
      <SafeAreaView edges={['top', 'left', 'right']} style={[s.safe, { backgroundColor: background }]}>
        {typeof progress === 'number' && (
          <View style={[s.progressTrack, { backgroundColor: border }]}>
            <View
              style={[s.progressFill, { backgroundColor: accent, width: `${Math.round(clamp01(progress) * 100)}%` }]}
            />
          </View>
        )}
        {showLogo ? (
          <View style={headerStyle}>
            <View style={s.logoWordmark}>
              <StudyoLogo size={28} color={accent} />
              <Text style={[s.logoWordmarkText, { color: accent }]}>Studyo</Text>
            </View>
            <View style={s.headerRight}>{right}</View>
          </View>
        ) : title || onBack || right ? (
          <View style={headerStyle}>
            <View style={s.titleLeft}>
              {onBack && (
                <Pressable
                  onPress={onBack}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={s.backBtn}
                  accessibilityRole="button">
                  <Icon name="chevron-left" size={24} />
                </Pressable>
              )}
              {title && (
                <Text
                  numberOfLines={1}
                  style={[s.titleText, { color: text, fontSize: isTablet ? 20 : 18, flex: 1 }]}>
                  {title}
                </Text>
              )}
            </View>
            {right}
          </View>
        ) : null}
        {scroll ? (
          <ScrollView
            style={s.flex1}
            contentContainerStyle={[contentStyle, contentContainerStyle]}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[s.flex1, contentStyle, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

// --- Card --------------------------------------------------------------------

export function Card({
  variant = 'outlined',
  onPress,
  style,
  children,
}: {
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  style?: object;
  children: ReactNode;
}) {
  const surface = useThemeColor('surface');
  const background = useThemeColor('background');
  const border = useThemeColor('border');
  const bg = variant === 'filled' ? background : surface;
  const { pressProps, pressStyle } = usePressed();

  const cardStyle = [s.card, { backgroundColor: bg, borderColor: border }, style];

  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={[...cardStyle, pressStyle]} {...pressProps}>
      {children}
    </Pressable>
  );
}

// --- Button ------------------------------------------------------------------

const BUTTON_BG: Record<string, string | undefined> = {
  primary: undefined, // set from useThemeColor
  secondary: undefined,
  ghost: 'transparent',
  danger: undefined,
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  children,
  loading = false,
  disabled = false,
  onPress,
  style,
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const danger = useThemeColor('danger');
  const onAccent = useThemeColor('onAccent');
  const text = useThemeColor('text');
  const inactive = disabled || loading;
  const { pressProps, pressStyle } = usePressed();

  const bgMap = { primary: accent, secondary: surface, ghost: 'transparent', danger };
  const labelColorMap = { primary: '#FFFFFF', secondary: text, ghost: accent, danger: '#FFFFFF' };
  const sizePad = { sm: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 44 },
    md: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
    lg: { paddingHorizontal: 20, paddingVertical: 16, minHeight: 48 } };

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        s.btn,
        sizePad[size],
        { backgroundColor: bgMap[variant] },
        variant === 'secondary' && { borderWidth: 1, borderColor: border },
        inactive && { opacity: 0.5 },
        inactive ? undefined : pressStyle,
        style,
      ]}
      {...pressProps}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? onAccent : accent} />
      ) : children ? (
        children
      ) : label ? (
        <Text style={[s.btnLabel, { color: labelColorMap[variant] }]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

// --- ProgressBar -------------------------------------------------------------

export function ProgressBar({ value, animate = true, style }: { value: number; animate?: boolean; style?: object }) {
  const accent = useThemeColor('accent');
  const track = useThemeColor('border');
  const progress = useSharedValue(clamp01(value));
  useEffect(() => {
    progress.value = animate ? withTiming(clamp01(value), { duration: 600 }) : clamp01(value);
  }, [animate, progress, value]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={[s.progressTrackBar, { backgroundColor: track }, style]}>
      <Animated.View style={[s.progressFillBar, { backgroundColor: accent }, barStyle]} />
    </View>
  );
}

// --- ProgressRing ------------------------------------------------------------

export function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 8,
  label,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Optional centered content — a `%` string renders as the ring's value. */
  label?: ReactNode;
}) {
  const accent = useThemeColor('accent');
  const track = useThemeColor('border');
  const text = useThemeColor('text');
  const pct = clamp100(progress);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center} cy={center} r={r}
          stroke={accent} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - pct / 100)}
          transform={`rotate(-90 ${center} ${center})`}
          fill="none"
        />
      </Svg>
      {label != null && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {typeof label === 'string' || typeof label === 'number' ? (
              <Text style={{ color: text, fontFamily: 'SpaceMono_700Bold', fontSize: size * 0.24 }}>{label}</Text>
            ) : (
              label
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// --- Badge -------------------------------------------------------------------

export function Badge({ variant = 'default', label, style }: { variant?: 'default' | 'success' | 'warning' | 'error'; label: string; style?: object }) {
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const success = useThemeColor('success');
  const star = useThemeColor('star');
  const danger = useThemeColor('danger');
  const bgMap = { default: surface, success, warning: star, error: danger };
  const textMap = { default: text, success: '#FFF', warning: '#FFF', error: '#FFF' };
  return (
    <View style={[s.badge, { backgroundColor: bgMap[variant] }, variant === 'default' && { borderWidth: 1, borderColor: border }, style]}>
      <Text style={[s.badgeText, { color: textMap[variant] }]}>{label}</Text>
    </View>
  );
}

// --- Avatar ------------------------------------------------------------------

export function Avatar({ size = 'md', name }: { size?: 'sm' | 'md' | 'lg'; name?: string }) {
  const accent = useThemeColor('accent');
  const onAccent = useThemeColor('onAccent');
  const dims = { sm: 32, md: 48, lg: 64 };
  const fonts = { sm: 14, md: 18, lg: 24 };
  const dim = dims[size];
  const initials = name
    ? name.trim().split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase()
    : '';
  return (
    <View style={[s.avatarBase, { width: dim, height: dim, backgroundColor: accent }]}>
      <Text style={{ fontSize: fonts[size], color: onAccent, fontFamily: 'Inter_600SemiBold' }}>{initials}</Text>
    </View>
  );
}

// --- Skeleton ----------------------------------------------------------------

export function Skeleton({ style }: { style?: object }) {
  const border = useThemeColor('border');
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
  }, [opacity]);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={aStyle}>
      <View style={[s.skeletonBase, { backgroundColor: border }, style]} />
    </Animated.View>
  );
}

// --- Toggle ------------------------------------------------------------------

export function Toggle({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const accent = useThemeColor('accent');
  const track = useThemeColor('border');
  const onAccent = useThemeColor('onAccent');
  const x = useSharedValue(value ? 22 : 0);
  useEffect(() => { x.value = withTiming(value ? 22 : 0, { duration: 150 }); }, [value, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[s.toggleTrack, { backgroundColor: value ? accent : track, opacity: disabled ? 0.5 : 1 }]}>
      <Animated.View style={[s.toggleThumb, { backgroundColor: onAccent }, thumb]} />
    </Pressable>
  );
}

// --- PageIndicator -----------------------------------------------------------

export function PageIndicator({ total, current }: { total: number; current: number }) {
  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  return (
    <View style={s.pageIndicator}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === current
              ? { width: 24, backgroundColor: accent }
              : { width: 8, backgroundColor: border },
          ]}
        />
      ))}
    </View>
  );
}

// --- Themed helpers (for backward compat) ------------------------------------

export const Themed = {
  View: ({ style, children, ...props }: ComponentProps<typeof View>) => {
    const surface = useThemeColor('surface');
    return <View style={[{ backgroundColor: surface }, style]} {...props}>{children}</View>;
  },
  Text: ({ style, children, ...props }: ComponentProps<typeof Text>) => {
    const text = useThemeColor('text');
    return <Text style={[{ color: text }, style]} {...props}>{children}</Text>;
  },
  Pressable: ({ style, children, ...props }: ComponentProps<typeof Pressable>) => {
    const surface = useThemeColor('surface');
    return <Pressable style={[{ backgroundColor: surface }, style as object]} {...props}>{children}</Pressable>;
  },
};

// --- Styles ------------------------------------------------------------------

const s = StyleSheet.create({
  flex1: { flex: 1 },
  screenRoot: { flex: 1 },
  safe: { flex: 1 },
  progressTrack: { height: 4 },
  progressFill: { height: 4 },
  logoWordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoWordmarkText: { fontFamily: 'SpaceMono_700Bold', fontSize: 20, letterSpacing: -0.5 },
  headerRight: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  titleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', flexShrink: 0 },
  titleText: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  btn: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  progressTrackBar: { width: '100%', height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFillBar: { height: '100%', borderRadius: 999 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignItems: 'center' },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  avatarBase: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  skeletonBase: { height: 16, borderRadius: 8 },
  toggleTrack: { width: 44, height: 28, borderRadius: 999, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 24, height: 24, borderRadius: 12 },
  pageIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 999 },
});
