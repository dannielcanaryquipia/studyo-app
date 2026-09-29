import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button, Card, Icon, Screen, useThemeColor } from '@/src/components/primitives';
import { SectionHeader, SettingsRow } from '@/src/components/composites';
import { NotificationBell } from '@/src/components/notification-bell';
import { courses } from '@/src/data/courses';
import { setItem } from '@/hooks/useStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useProfile, initials } from '@/hooks/useProfile';
import { useProgressStore } from '@/hooks/useProgressStore';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';

const THEME_LABEL: Record<string, string> = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ProfileScreen() {
  const router = useRouter();
  const { quizAttempts } = useProgressStore();
  const { pref } = useTheme();
  const { name, tagline, avatarUri, setProfile } = useProfile();

  const scores = Object.values(quizAttempts);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const accent = useThemeColor('accent');
  const background = useThemeColor('background');
  const border = useThemeColor('border');
  const danger = useThemeColor('danger');
  const onAccent = useThemeColor('onAccent');
  const textMuted = useThemeColor('textMuted');
  const text = useThemeColor('text');
  const surface = useThemeColor('surface');

  const { isTablet, headingSize, bodySize } = useResponsive();
  const avatarSize = isTablet ? 120 : 96;

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftTagline, setDraftTagline] = useState(tagline);

  const startEdit = useCallback(() => { setDraftName(name); setDraftTagline(tagline); setEditing(true); }, [name, tagline]);
  const saveEdit = useCallback(() => { setProfile({ name: draftName.trim() || 'Learner', tagline: draftTagline.trim() }); setEditing(false); }, [draftName, draftTagline, setProfile]);

  const pickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to set a profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    setProfile({ avatarUri: uri });
  }, [setProfile]);

  const removePhoto = useCallback(() => setProfile({ avatarUri: undefined }), [setProfile]);
  const handleLogOut = useCallback(async () => { await setItem(STORAGE_KEYS.onboarded, false); router.replace('/splash'); }, [router]);

  return (
    <Screen showLogo right={<NotificationBell />} contentContainerStyle={{ gap: 20 }}>
      {/* Avatar hero */}
      <Card style={{ alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ position: 'relative' }}>
          <View style={[s.avatar, { backgroundColor: accent, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: avatarSize, height: avatarSize }} resizeMode="cover" />
            ) : (
              <Text style={[s.avatarInitials, { color: onAccent, fontSize: avatarSize * 0.375 }]}>{initials(name)}</Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={pickPhoto}
            style={[s.cameraBtn, { backgroundColor: accent, borderColor: background }]}>
            <Icon name="photo-camera" size={14} color={onAccent} />
          </Pressable>
        </View>

        {editing ? (
          <View style={{ width: '100%', gap: 12, paddingTop: 4 }}>
            <View style={{ gap: 4 }}>
              <Text style={[s.inputLabel, { color: textMuted }]}>Display name</Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Your name"
                placeholderTextColor={textMuted}
                autoFocus
                maxLength={40}
                style={[s.input, { borderColor: border, backgroundColor: background, color: text }]}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[s.inputLabel, { color: textMuted }]}>Tagline</Text>
              <TextInput
                value={draftTagline}
                onChangeText={setDraftTagline}
                placeholder="e.g. Studyo Student"
                placeholderTextColor={textMuted}
                maxLength={60}
                style={[s.input, { borderColor: border, backgroundColor: background, color: text }]}
              />
            </View>
            {avatarUri ? (
              <Pressable onPress={removePhoto} accessibilityRole="button" style={s.removePhotoBtn}>
                <Icon name="delete-outline" size={16} color={danger} />
                <Text style={[s.removePhotoText, { color: danger }]}>Remove photo</Text>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
              <Button variant="secondary" label="Cancel" onPress={() => setEditing(false)} style={{ flex: 1 }} />
              <Button variant="primary" label="Save" onPress={saveEdit} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={[s.profileName, { color: text, fontSize: isTablet ? 24 : 20 }]}>{name}</Text>
            {tagline ? <Text style={[s.profileTagline, { color: textMuted, fontSize: bodySize }]}>{tagline}</Text> : null}
            <Pressable onPress={startEdit} accessibilityRole="button" style={s.editBtn}>
              <Icon name="edit" size={14} color={accent} />
              <Text style={[s.editLabel, { color: accent }]}>Edit profile</Text>
            </Pressable>
          </View>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 32, paddingTop: 4 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={[s.statValue, { color: accent }]}>{courses.length}</Text>
            <Text style={[s.statLabel, { color: textMuted }]}>COURSES</Text>
          </View>
          <View style={{ width: 1, backgroundColor: border }} />
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={[s.statValue, { color: accent }]}>{avgScore !== null ? `${avgScore}%` : '—'}</Text>
            <Text style={[s.statLabel, { color: textMuted }]}>AVG SCORE</Text>
          </View>
        </View>
      </Card>

      {/* Settings */}
      <View style={{ gap: 12 }}>
        <SectionHeader title="Settings" style={{ paddingHorizontal: 4 }} />
        <View style={[s.settingsGroup, { borderColor: border, backgroundColor: surface }]}>
          <SettingsRow icon="manage-accounts" label="Account" locked />
          <View style={[s.divider, { backgroundColor: border }]} />
          <SettingsRow icon="notifications-active" label="Notifications" onPress={() => router.push('/settings/notifications')} />
          <View style={[s.divider, { backgroundColor: border }]} />
          <SettingsRow icon="dark-mode" label="Theme" value={THEME_LABEL[pref] ?? 'System'} onPress={() => router.push('/settings/theme')} />
          <View style={[s.divider, { backgroundColor: border }]} />
          <SettingsRow icon="info" label="About Studyo" onPress={() => router.push('/about')} />
        </View>
      </View>

      {/* Log out */}
      <Pressable
        onPress={handleLogOut}
        accessibilityRole="button"
        accessibilityLabel="Log Out"
        style={[s.logoutBtn, { borderColor: `${danger}4d`, backgroundColor: surface }]}>
        <Icon name="logout" size={20} color={danger} />
        <Text style={[s.logoutText, { color: danger }]}>Log Out</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 96, height: 96 },
  avatarInitials: { fontSize: 36, fontFamily: 'Inter_600SemiBold' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  inputLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, minHeight: 44, fontFamily: 'Inter_400Regular', fontSize: 16 },
  removePhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44 },
  removePhotoText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  profileName: { fontFamily: 'SpaceMono_700Bold', fontSize: 20 },
  profileTagline: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, minHeight: 44, paddingHorizontal: 8 },
  editLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  statValue: { fontFamily: 'SpaceMono_700Bold', fontSize: 18 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  settingsGroup: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, minHeight: 44, paddingVertical: 16 },
  logoutText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
