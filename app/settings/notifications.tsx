import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Card, Icon, Screen, useThemeColor } from '@/src/components/primitives';
import { useNotifications } from '@/hooks/useNotifications';
import type { MaterialIconName } from '@/types/course';

function AnimatedToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: 200 }), [value]);
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [border, accent]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 22 : 2, { duration: 200 }) }],
  }));

  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <Animated.View style={[s.track, trackStyle]}>
        <Animated.View style={[s.thumb, { backgroundColor: surface }, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

function SettingRow({ icon, label, value, onChange }: { icon: MaterialIconName; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');

  return (
    <View style={s.row}>
      <View style={[s.iconWrap, { backgroundColor: `${accent}1A` }]}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <Text style={[s.rowLabel, { color: text, flex: 1 }]}>{label}</Text>
      <AnimatedToggle value={value} onChange={onChange} />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { pushEnabled, emailEnabled, quietHoursEnabled, togglePush, toggleEmail, toggleQuietHours } = useNotifications();
  const border = useThemeColor('border');
  const text = useThemeColor('text');

  return (
    <Screen title="Notifications" onBack={() => router.back()}>
      {/* Channels */}
      <Text style={[s.sectionTitle, { color: text }]}>Channels</Text>
      <Card style={{ gap: 0 }}>
        <SettingRow icon="notifications" label="Push Notifications" value={pushEnabled} onChange={togglePush} />
        <View style={[s.divider, { backgroundColor: border }]} />
        <SettingRow icon="email" label="Email Digest" value={emailEnabled} onChange={toggleEmail} />
      </Card>

      {/* Schedule */}
      <Text style={[s.sectionTitle, { color: text }]}>Schedule</Text>
      <Card style={{ gap: 0 }}>
        <SettingRow icon="dark-mode" label="Quiet Hours (10pm–7am)" value={quietHoursEnabled} onChange={toggleQuietHours} />
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  divider: { height: 1 },
  track: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
});
