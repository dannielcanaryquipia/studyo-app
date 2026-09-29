import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { Card, Icon, Screen, Skeleton, useThemeColor } from '@/src/components/primitives';
import { CategoryChips, CourseCard, EmptyState, LessonListItem } from '@/src/components/composites';
import { NotificationBell } from '@/src/components/notification-bell';
import { courses } from '@/src/data/courses';
import { searchCourses } from '@/lib/search';
import { lessonText, useContentLang } from '@/hooks/useContentLang';
import { useProgressStore } from '@/hooks/useProgressStore';
import { useResponsive } from '@/hooks/useResponsive';

const MAX_LESSON_CARDS = 4;
const SEARCH_INPUT_STYLE = Platform.select({ web: { outlineWidth: 0, outlineStyle: 'none' } }) as unknown as StyleProp<TextStyle>;

export default function CoursesScreen() {
  const router = useRouter();
  const { courseProgressFor, statusFor, hydrating } = useProgressStore();
  const { lang } = useContentLang();
  const params = useLocalSearchParams<{ category?: string }>();
  const { gap, isTablet, isLandscape } = useResponsive();
  const [active, setActive] = useState<string | null>(params.category ?? null);
  const [search, setSearch] = useState('');

  const textMuted = useThemeColor('textMuted');
  const borderColor = useThemeColor('border');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const accent = useThemeColor('accent');

  const presets = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.category));
    return ['All', ...Array.from(set)] as const;
  }, []);

  const chips = useMemo(
    () => presets.map((p) => ({ id: p, label: p, selected: active === p || (p === 'All' && active === null) })),
    [presets, active],
  );

  const searching = search.trim().length > 0;
  const results = useMemo(() => {
    const scoped = active && active !== 'All' ? courses.filter((c) => c.category === active) : courses;
    return searchCourses(scoped, search);
  }, [active, search]);

  // On tablet/landscape show a 2-col grid when not searching
  const useGrid = (isTablet || isLandscape) && !searching;

  return (
    <View style={{ flex: 1 }}>
      <Screen showLogo right={<NotificationBell />}>
        {/* Search */}
        <View style={[s.searchBox, { borderColor, backgroundColor: surface }]}>
          <Icon name="search" size={20} color={textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search courses..."
            placeholderTextColor={textMuted}
            style={[s.searchInput, { color: text }, SEARCH_INPUT_STYLE]}
            underlineColorAndroid="transparent"
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search" style={s.clearBtn}>
              <Icon name="close" size={18} color={textMuted} />
            </Pressable>
          )}
        </View>

        <CategoryChips categories={chips} onToggle={(id) => setActive(id === 'All' ? null : id)} />

        {hydrating ? (
          <View style={useGrid ? [s.grid, { gap }] : { gap }}>
            {[0, 1, 2].map((i) => (
              <Card key={i} style={useGrid ? s.gridItem : undefined}>
                <View style={{ gap: 12 }}>
                  <View style={{ height: 12, width: 64, borderRadius: 8, backgroundColor: borderColor }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ height: 48, width: 48, borderRadius: 16, backgroundColor: borderColor }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <View style={{ height: 16, borderRadius: 8, backgroundColor: borderColor }} />
                      <View style={{ height: 12, width: '50%', borderRadius: 8, backgroundColor: borderColor }} />
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : courses.length === 0 ? (
          <EmptyState icon="menu-book" title="No courses yet" body="The catalog fills in once content lands." />
        ) : results.length === 0 ? (
          <EmptyState icon="search" title="Nothing here yet" body="Try a different search or category." />
        ) : useGrid ? (
          <View style={[s.grid, { gap }]}>
            {results.map(({ course }) => (
              <View key={course.id} style={s.gridItem}>
                <CourseCard
                  course={course}
                  variant="list"
                  progress={courseProgressFor(course)}
                  onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap }}>
            {results.map(({ course, matchedLessons }) => (
              <View key={course.id} style={{ gap: 8 }}>
                <CourseCard
                  course={course}
                  variant="list"
                  progress={courseProgressFor(course)}
                  onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                />
                {searching && matchedLessons.length > 0 && (
                  <View style={{ gap: 6, paddingLeft: 12 }}>
                    <Text style={[s.matchLabel, { color: muted }]}>Matching lessons</Text>
                    {matchedLessons.slice(0, MAX_LESSON_CARDS).map((lesson) => {
                      const status = statusFor(course.lessons, lesson.id);
                      return (
                        <LessonListItem
                          key={lesson.id}
                          lesson={{ ...lesson, status, title: lessonText(lesson, lang).title }}
                          note={status === 'locked' ? 'Locked — open the course to unlock' : undefined}
                          onPress={status !== 'locked' ? () => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } }) : undefined}
                        />
                      );
                    })}
                    {matchedLessons.length > MAX_LESSON_CARDS && (
                      <Text style={[s.matchMore, { color: muted }]}>+{matchedLessons.length - MAX_LESSON_CARDS} more in this course</Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, minHeight: 44 },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16 },
  clearBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  matchLabel: { paddingHorizontal: 4, fontFamily: 'Inter_400Regular', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  matchMore: { paddingHorizontal: 4, fontFamily: 'Inter_400Regular', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { flex: 1, minWidth: 280 },
});
