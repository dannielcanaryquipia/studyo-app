import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Icon, Screen, useThemeColor } from '@/src/components/primitives';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePref } from '@/types/user';
import type { MaterialIconName } from '@/types/course';

const OPTIONS: { label: string; value: ThemePref; icon: MaterialIconName; desc: string }[] = [
  { label: 'Light', value: 'light', icon: 'light-mode', desc: 'Always use light mode' },
  { label: 'Dark', value: 'dark', icon: 'dark-mode', desc: 'Always use dark mode' },
  { label: 'System', value: 'system', icon: 'settings-brightness', desc: 'Follow system preference' },
];

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { pref, setPref } = useTheme();

  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');

  return (
    <Screen title="Theme" onBack={() => router.back()}>
      <View style={{ gap: 12 }}>
        {OPTIONS.map((opt) => {
          const active = pref === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setPref(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[
                s.optionCard,
                {
                  borderColor: active ? accent : border,
                  backgroundColor: active ? `${accent}0D` : surface,
                },
              ]}>
              <View style={[s.optionIcon, { backgroundColor: active ? `${accent}1A` : background }]}>
                <Icon name={opt.icon} size={22} color={active ? accent : muted} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.optionLabel, { color: text }]}>{opt.label}</Text>
                <Text style={[s.optionDesc, { color: muted }]}>{opt.desc}</Text>
              </View>
              {/* Radio circle */}
              <View style={[s.radioOuter, { borderColor: active ? accent : border }]}>
                {active && <View style={[s.radioInner, { backgroundColor: accent }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Preview */}
      <Text style={[s.previewTitle, { color: text }]}>Preview</Text>
      <Text style={[s.previewSub, { color: muted }]}>Changes apply immediately.</Text>
      <Card style={{ gap: 8 }}>
        <Text style={[s.previewCategory, { color: accent }]}>WIKA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[s.previewIcon, { backgroundColor: `${accent}1A` }]}>
            <Icon name="menu-book" size={24} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.previewCourseName, { color: text }]}>Ortograpiyang Pambansa</Text>
            <Text style={[s.previewCourseAuthor, { color: muted }]}>Komisyon sa Wikang Filipino</Text>
          </View>
        </View>
        <Text style={[s.previewMeta, { color: muted }]}>40% complete · 2h 30m</Text>
        <View style={[s.previewBarTrack, { backgroundColor: border }]}>
          <View style={[s.previewBarFill, { backgroundColor: accent, width: '40%' }]} />
        </View>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 16, minHeight: 72 },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  optionDesc: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  previewTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  previewSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: -6 },
  previewCategory: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  previewIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewCourseName: { fontFamily: 'SpaceMono_700Bold', fontSize: 14 },
  previewCourseAuthor: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  previewMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  previewBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  previewBarFill: { height: 4, borderRadius: 2 },
});
