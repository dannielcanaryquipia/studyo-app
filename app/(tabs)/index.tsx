import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card, Icon, ProgressBar, Screen, Skeleton, useThemeColor } from '@/src/components/primitives';
import { CourseCard, EmptyState, SectionHeader } from '@/src/components/composites';
import { NotificationBell } from '@/src/components/notification-bell';
import { courses } from '@/src/data/courses';
import { goalToMinutes } from '@/lib/onboarding';
import { getItem } from '@/hooks/useStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useProfile, firstName } from '@/hooks/useProfile';
import { useProgressStore } from '@/hooks/useProgressStore';
import { useResponsive } from '@/hooks/useResponsive';
import type { Goal } from '@/types/user';

const GOAL_LABEL: Record<Goal, string> = { casual: 'Casual', regular: 'Regular', intensive: 'Intensive' };

export default function HomeScreen() {
  const router = useRouter();
  const { courseProgressFor, hydrating } = useProgressStore();
  const { name } = useProfile();
  const { hPad, gap, headingSize, bodySize, isTablet, isLandscape, cols } = useResponsive();

  const fire = useThemeColor('star');
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const [goal, setGoal] = useState<Goal>();

  useEffect(() => {
    getItem<Goal>(STORAGE_KEYS.goal).then((g) => g && setGoal(g));
  }, []);

  const goalMinutes = goalToMinutes(goal);
  const goalLabel = goal ? GOAL_LABEL[goal] : 'Casual';
  const studiedMinutes = 0;
  const goalPct = goalMinutes > 0 ? Math.min(1, studiedMinutes / goalMinutes) : 0;

  const continueCourse = courses.find((c) => courseProgressFor(c) > 0) ?? courses[0];
  const recommended = courses.filter((c) => courseProgressFor(c) === 0);

  // On tablet/landscape, recommended courses show in a 2-column grid
  const recommendedCols = isTablet || isLandscape ? cols(260) : 1;
  const recommendedHorizontal = recommendedCols === 1;

  const openCourse = (id: string) => router.push({ pathname: '/course/[id]', params: { id } });

  return (
    <Screen showLogo right={<NotificationBell />}>
      <View style={{ gap: 4 }}>
        <Text style={[s.greeting, { color: text, fontSize: headingSize }]}>Hello, {firstName(name)}!</Text>
        <Text style={[s.greetingSub, { color: muted, fontSize: bodySize }]}>Ready to continue your journey?</Text>
      </View>

      {/* Bento stats — always side by side */}
      <View style={{ flexDirection: 'row', gap }}>
        <Card style={[s.bentoCard, { padding: hPad > 20 ? 20 : 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="local-fire-department" size={isTablet ? 26 : 22} color={fire} />
            <Text style={[s.bentoLabel, { color: muted, fontSize: bodySize }]}>Daily Streak</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Text style={[s.bentoValue, { color: accent, fontSize: isTablet ? 36 : 30 }]}>0</Text>
            <Text style={[s.bentoUnit, { color: muted, fontSize: bodySize }]}>Days</Text>
          </View>
        </Card>
        <Card style={[s.bentoCard, { padding: hPad > 20 ? 20 : 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[s.bentoLabel, { color: muted, fontSize: bodySize }]}>Daily Goal</Text>
            <Text style={[s.bentoSmall, { color: muted }]}>{studiedMinutes}/{goalMinutes} min</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={[s.bentoSmall, { color: accent }]}>{goalLabel} pace</Text>
            <ProgressBar value={goalPct} />
          </View>
        </Card>
      </View>

      <SectionHeader title="Continue Learning" action="View All" onAction={() => router.push('/(tabs)/courses')} />
      {hydrating ? (
        <Card>
          <View style={{ gap: 12 }}>
            <Skeleton style={{ height: 12, width: 64 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Skeleton style={{ height: 48, width: 48, borderRadius: 16 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ height: 16 }} />
                <Skeleton style={{ height: 12 }} />
              </View>
            </View>
            <Skeleton style={{ height: 8, borderRadius: 999 }} />
          </View>
        </Card>
      ) : courses.length === 0 ? (
        <EmptyState icon="menu-book" title="No courses yet" body="The course library is empty. Check back soon." />
      ) : continueCourse ? (
        <CourseCard
          course={continueCourse}
          variant="list"
          progress={courseProgressFor(continueCourse)}
          onPress={() => openCourse(continueCourse.id)}
        />
      ) : null}

      {recommended.length > 0 && (
        <>
          <SectionHeader title="Recommended for You" />
          {recommendedHorizontal ? (
            <FlatList
              horizontal
              data={recommended}
              keyExtractor={(c) => c.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap }}
              renderItem={({ item }) => (
                <CourseCard course={item} variant="compact" progress={0} onPress={() => openCourse(item.id)} />
              )}
            />
          ) : (
            <View style={s.gridWrap}>
              {recommended.map((item) => (
                <View key={item.id} style={{ flex: 1, minWidth: 240 }}>
                  <CourseCard course={item} variant="list" progress={0} onPress={() => openCourse(item.id)} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  greeting: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  greetingSub: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  bentoCard: { flex: 1, justifyContent: 'space-between', gap: 12 },
  bentoLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  bentoValue: { fontFamily: 'SpaceMono_700Bold', fontSize: 30 },
  bentoUnit: { fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 4 },
  bentoSmall: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
