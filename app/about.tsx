import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Icon, Screen, useThemeColor } from '@/src/components/primitives';
import StudyoLogo from '@/src/components/StudyoLogo';

const FEATURES = [
  { icon: 'menu-book', title: 'Filipino Orthography', desc: 'Based on the Ortograpiyang Pambansa (KWF 2013) and Bikol–Sorsogon regional reference.' },
  { icon: 'cloud-off', title: 'Offline-First', desc: 'All lessons load from your device — no network required during study.' },
  { icon: 'leaderboard', title: 'Progress Tracking', desc: 'Track completed lessons, quiz scores, and earned achievements as you learn.' },
  { icon: 'dark-mode', title: 'Dark Mode', desc: 'Easy on the eyes — follow system preference or pick a theme manually.' },
] as const;

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const router = useRouter();

  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <Screen title="About" onBack={() => router.back()}>
      {/* Logo hero */}
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <View style={[s.logoWrap, { backgroundColor: surface, borderColor: border }]}>
          <StudyoLogo size={52} />
        </View>
        <Text style={[s.appName, { color: text }]}>Studyo</Text>
        <Text style={[s.version, { color: muted }]}>Version {APP_VERSION}</Text>
      </View>

      {/* Feature cards */}
      <View style={{ gap: 12 }}>
        {FEATURES.map((f) => (
          <Card key={f.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={[s.iconWrap, { backgroundColor: `${accent}1A` }]}>
              <Icon name={f.icon} size={22} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.featureTitle, { color: text }]}>{f.title}</Text>
              <Text style={[s.featureDesc, { color: muted }]}>{f.desc}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingVertical: 8, gap: 2 }}>
        <Text style={[s.footer, { color: muted }]}>Made with ♥ for Filipino language learners</Text>
        <Text style={[s.footer, { color: muted }]}>© 2025 Studyo</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  logoWrap: { width: 88, height: 88, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: 'SpaceMono_700Bold', fontSize: 22 },
  version: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  featureDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  footer: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
