import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, useThemeColor } from '@/src/components/primitives';
import { EmptyState, NotificationItem } from '@/src/components/composites';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types/notification';

const FILTERS = ['All', 'Unread', 'Course', 'System'] as const;
type Filter = (typeof FILTERS)[number];

type Section = { title: string; data: AppNotification[] };

function groupByTime(items: AppNotification[]): Section[] {
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  for (const item of items) {
    if (item.time === 'Today' || item.time === 'today') {
      today.push(item);
    } else {
      earlier.push(item);
    }
  }

  const sections: Section[] = [];
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (earlier.length > 0) sections.push({ title: 'Earlier', data: earlier });
  return sections;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('All');

  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const muted = useThemeColor('textMuted');
  const onAccent = useThemeColor('onAccent');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Course') return n.type === 'course';
    if (filter === 'System') return n.type === 'system';
    return true;
  });

  const sections = groupByTime(filtered);

  return (
    <Screen title="Notifications" onBack={() => router.back()}>
      {/* Filter tabs + mark all read */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[s.filterRow, { borderColor: border, backgroundColor: surface }]}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[s.filterBtn, active && { backgroundColor: accent }]}>
                <Text style={[s.filterText, { color: active ? onAccent : muted }]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} accessibilityRole="button" style={s.markAllBtn}>
            <Text style={[s.markAllText, { color: accent }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon="notifications-none"
          title="No notifications"
          body={filter === 'All' ? "You're all caught up!" : `No ${filter.toLowerCase()} notifications.`}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={[s.sectionHeader, { color: muted }]}>{section.title}</Text>
          )}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: border, marginHorizontal: 16 }} />}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => !item.read && markRead(item.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  filterRow: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4, gap: 4 },
  filterBtn: { borderRadius: 999, paddingHorizontal: 12, minHeight: 34, justifyContent: 'center' },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  markAllBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  markAllText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  sectionHeader: { fontFamily: 'Inter_600SemiBold', fontSize: 14, paddingTop: 8, paddingBottom: 4 },
});
