import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card, Icon, ProgressBar, ProgressRing, Screen, useThemeColor } from '@/src/components/primitives';
import { AchievementBadge, EmptyState, SectionHeader } from '@/src/components/composites';
import { NotificationBell } from '@/src/components/notification-bell';
import { computeAchievements } from '@/src/data/achievements';
import { courses } from '@/src/data/courses';
import { useProgressStore } from '@/hooks/useProgressStore';
import { useResponsive } from '@/hooks/useResponsive';
import { averageScore } from '@/lib/quiz-scoring';

export default function ProgressScreen() {
  const router = useRouter();
  const { completions, quizAttempts, completeCount, courseProgressFor } = useProgressStore();
  const { gap, isTablet, isLandscape, headingSize, bodySize } = useResponsive();

  const primaryFixed = useThemeColor('primaryFixed');
  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const fire = useThemeColor('star');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const totalLessons = useMemo(() => courses.reduce((sum, c) => sum + c.lessons.length, 0), []);
  const overallPct = totalLessons === 0 ? 0 : Math.round((completeCount / totalLessons) * 100);

  const quizScores = useMemo(() => Object.values(quizAttempts), [quizAttempts]);
  const quizzesTaken = quizScores.length;
  const quizAvg = averageScore(quizScores);

  const achievements = useMemo(() => computeAchievements(completions, quizAttempts, courses), [completions, quizAttempts]);
  const earnedCount = achievements.filter((a) => a.earned).length;

  const ringSize = isTablet ? 120 : 100;
  const miniCardDirection = isTablet || isLandscape ? 'row' as const : 'column' as const;

  return (
    <Screen showLogo right={<NotificationBell />}>
      <View style={{ gap: 4 }}>
        <Text style={[s.title, { color: text, fontSize: headingSize }]}>Your Progress</Text>
        <Text style={[s.sub, { color: muted, fontSize: bodySize }]}>Keep up the momentum.</Text>
      </View>

      {/* Bento — ring + 3 mini stats */}
      <View style={{ flexDirection: 'row', gap }}>
        <Card style={[s.bentoLeft, { flex: isTablet ? 0.6 : 1 }]}>
          <ProgressRing progress={overallPct} size={ringSize} strokeWidth={9} />
          <Text style={[s.ringPct, { color: text, fontSize: isTablet ? 28 : 24 }]}>{overallPct}%</Text>
          <Text style={[s.ringLabel, { color: muted }]}>Overall</Text>
        </Card>
        <View style={{ flex: 1, gap: 8, flexDirection: miniCardDirection }}>
          <View style={[s.miniCard, { flex: 1, backgroundColor: primaryFixed }]}>
            <Icon name="local-fire-department" size={isTablet ? 26 : 22} color={fire} />
            <Text style={[s.miniValue, { color: text, fontSize: isTablet ? 24 : 20 }]}>0</Text>
            <Text style={[s.miniLabel, { color: muted }]}>Day Streak</Text>
          </View>
          <View style={[s.miniCard, { flex: 1, borderWidth: 1, borderColor: border, backgroundColor: surface }]}>
            <Icon name="quiz" size={isTablet ? 22 : 18} color={accent} />
            <Text style={[s.miniValue, { color: text, fontSize: isTablet ? 24 : 20 }]}>{quizzesTaken > 0 ? `${quizAvg}%` : '—'}</Text>
            <Text style={[s.miniLabel, { color: muted }]}>Quiz Avg</Text>
          </View>
          <View style={[s.miniCard, { flex: 1, borderWidth: 1, borderColor: border, backgroundColor: surface }]}>
            <Icon name="task-alt" size={isTablet ? 22 : 18} color={success} />
            <Text style={[s.miniValue, { color: text, fontSize: isTablet ? 24 : 20 }]}>{completeCount}</Text>
            <Text style={[s.miniLabel, { color: muted }]}>Lessons Done</Text>
          </View>
        </View>
      </View>

      {/* Quiz performance */}
      <SectionHeader title="Quiz Performance" />
      {quizzesTaken === 0 ? (
        <EmptyState icon="quiz" title="No quizzes yet" body="Take a lesson quiz to start tracking your average score." />
      ) : (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <ProgressRing progress={quizAvg} size={isTablet ? 88 : 72} strokeWidth={7} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[s.ringPct, { color: text, fontSize: isTablet ? 28 : 24 }]}>{quizAvg}%</Text>
            <Text style={[s.sub, { color: muted, fontSize: bodySize }]}>
              Average across {quizzesTaken} quiz{quizzesTaken === 1 ? '' : 'zes'} taken
            </Text>
          </View>
        </Card>
      )}

      {/* Course breakdown */}
      {courses.length > 0 && (
        <>
          <SectionHeader title="Course Breakdown" />
          <View style={{ gap: 12 }}>
            {courses.map((course) => {
              const pct = Math.round(courseProgressFor(course) * 100);
              return (
                <View key={course.id} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[s.sub, { color: text, fontSize: bodySize }]} numberOfLines={1}>{course.title}</Text>
                    <Text style={[s.miniLabel, { color: muted }]}>{pct}%</Text>
                  </View>
                  <ProgressBar value={courseProgressFor(course)} animate={false} />
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Achievements */}
      <SectionHeader
        title="Achievements"
        subtitle={`${earnedCount} of ${achievements.length} earned`}
        action="See All"
        onAction={() => router.push('/achievements')}
      />
      {achievements.length === 0 ? (
        <EmptyState icon="emoji-events" title="No achievements yet" body="Complete lessons and quizzes to unlock badges." />
      ) : (
        <FlatList
          horizontal
          data={achievements}
          keyExtractor={(a) => a.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          renderItem={({ item }) => (
            <AchievementBadge achievement={item} variant={item.earned ? 'primary' : 'locked'} style={{ width: isTablet ? 160 : 128 }} />
          )}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  bentoLeft: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  ringPct: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  ringLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  miniCard: { borderRadius: 16, padding: 12, gap: 4 },
  miniValue: { fontFamily: 'SpaceMono_700Bold', fontSize: 20 },
  miniLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
