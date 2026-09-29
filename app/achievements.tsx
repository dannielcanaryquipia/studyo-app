import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ProgressBar, Screen, useThemeColor } from '@/src/components/primitives';
import { AchievementBadge, EmptyState } from '@/src/components/composites';
import { computeAchievements } from '@/src/data/achievements';
import { courses } from '@/src/data/courses';
import { useProgressStore } from '@/hooks/useProgressStore';

const FILTERS = ['All', 'Earned', 'Locked'] as const;
type Filter = (typeof FILTERS)[number];

export default function AchievementsScreen() {
  const router = useRouter();
  const { completions, quizAttempts } = useProgressStore();
  const [filter, setFilter] = useState<Filter>('All');

  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const onAccent = useThemeColor('onAccent');

  const achievements = useMemo(() => computeAchievements(completions, quizAttempts, courses), [completions, quizAttempts]);
  const earnedCount = achievements.filter((a) => a.earned).length;
  const earnedPercent = achievements.length > 0 ? Math.round((earnedCount / achievements.length) * 100) : 0;

  const filtered = achievements.filter((a) => {
    if (filter === 'Earned') return a.earned;
    if (filter === 'Locked') return !a.earned;
    return true;
  });

  return (
    <Screen title="Achievements" onBack={() => router.back()}>
      {/* Progress summary */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[s.statsText, { color: text }]}>
            {earnedCount} of {achievements.length} earned
          </Text>
          <Text style={[s.statsText, { color: muted }]}>{earnedPercent}%</Text>
        </View>
        <ProgressBar value={earnedPercent} />
      </View>

      {/* Filter tabs */}
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

      {filtered.length === 0 ? (
        <EmptyState
          icon="emoji-events"
          title={filter === 'Earned' ? 'No achievements yet' : 'All achievements earned!'}
          body={filter === 'Earned' ? 'Keep learning to unlock achievements.' : 'You have earned every achievement available.'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{ gap: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <AchievementBadge
              achievement={item}
              variant={item.earned ? 'primary' : 'locked'}
              style={{ flex: 1 }}
            />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  filterRow: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 4, alignSelf: 'flex-start', gap: 4 },
  filterBtn: { borderRadius: 999, paddingHorizontal: 16, minHeight: 36, justifyContent: 'center' },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  statsText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
