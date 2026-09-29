import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Icon, ProgressBar, Screen, useThemeColor } from '@/src/components/primitives';
import { EmptyState, LessonListItem, SectionHeader } from '@/src/components/composites';
import { courses, lessonQuizzes } from '@/src/data/courses';
import { courseText, lessonText, useContentLang } from '@/hooks/useContentLang';
import { useProgressStore } from '@/hooks/useProgressStore';
import type { ContentLang } from '@/types/course';

const minsLabel = (ms: number) => `${Math.max(1, Math.ceil(ms / 60000))} min`;

export default function CourseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { statusFor, unlockAtFor, courseProgressFor, isComplete, bestScore } = useProgressStore();
  const { lang, setLang } = useContentLang();

  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const muted = useThemeColor('textMuted');
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');

  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum'>('overview');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const course = courses.find((c) => c.id === params.id);
  const courseQuizzes = useMemo(() => lessonQuizzes.filter((q) => q.courseId === params.id), [params.id]);

  const statuses = useMemo(
    () => (course ? course.lessons.map((lesson) => ({ lesson, status: statusFor(course.lessons, lesson.id) })) : []),
    [course, statusFor],
  );

  if (!course) {
    return (
      <Screen onBack={() => router.back()}>
        <EmptyState
          icon="search"
          title="Course not found"
          body="It may not be in the library yet."
          action={<Button variant="secondary" label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const progress = courseProgressFor(course);
  const currentEntry = statuses.find(({ status }) => status === 'current');
  const hasProgress = statuses.some(({ status }) => status === 'completed');
  const allDone = statuses.length > 0 && statuses.every(({ status }) => status === 'completed');
  const timeLocked = !currentEntry && !allDone;
  const ctaTarget = currentEntry ?? statuses.find(({ status }) => status !== 'locked');
  const gatedEntry = timeLocked ? statuses.find(({ status }) => status === 'locked') : undefined;
  const gatedAt = gatedEntry ? unlockAtFor(course.lessons, gatedEntry.lesson.id) : null;
  const ctaLabel = timeLocked
    ? gatedAt ? `Available in ${minsLabel(Math.max(0, gatedAt - now))}` : 'Available soon'
    : allDone ? 'Review course' : hasProgress ? 'Continue' : 'Start';

  const t = courseText(course, lang);
  const bilingual = !!course.bicol;

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      <Screen onBack={() => router.back()}>
        <View style={{ gap: 12 }}>
          {/* Hero row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={[s.heroIcon, { backgroundColor: `${accent}26` }]}>
              <Icon name={course.icon} size={32} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.courseTitle, { color: text }]}>{t.title}</Text>
              <Text style={[s.courseMeta, { color: muted }]}>{course.instructor}</Text>
            </View>
          </View>

          {/* Language toggle for bilingual courses */}
          {bilingual && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="translate" size={16} color={accent} />
              <View style={[s.langToggle, { borderColor: border }]}>
                {(['tl', 'bcl'] as const).map((code) => {
                  const active = lang === code;
                  return (
                    <Pressable
                      key={code}
                      onPress={() => setLang(code as ContentLang)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[s.langBtn, active && { backgroundColor: accent }]}>
                      <Text style={[s.langText, { color: active ? '#FFF' : muted }]}>
                        {code === 'tl' ? 'Tagalog' : 'Bikol'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Badges */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {progress >= 1 ? <Badge variant="success" label="Completed" /> : null}
            <Badge variant="default" label={course.category} />
          </View>

          {/* Progress info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[s.courseMeta, { color: muted }]}>{Math.round(progress * 100)}% complete</Text>
            <Text style={[s.courseMeta, { color: muted }]}>·</Text>
            <Text style={[s.courseMeta, { color: muted }]}>{course.duration}</Text>
          </View>
          <ProgressBar value={progress} />

          {/* Tab bar */}
          <View style={[s.tabBar, { borderBottomColor: border }]}>
            {(['overview', 'curriculum'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
                style={s.tabBtn}>
                <Text style={[s.tabText, { color: activeTab === tab ? accent : muted },
                  activeTab === tab && { fontFamily: 'Inter_600SemiBold' }]}>
                  {tab === 'overview' ? 'Overview' : 'Curriculum'}
                </Text>
                {activeTab === tab && (
                  <View style={[s.tabIndicator, { backgroundColor: accent }]} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Overview */}
          {activeTab === 'overview' && (
            <View style={{ gap: 12 }}>
              <Text style={[s.bodyText, { color: text }]}>{t.description}</Text>
              <View style={[s.outcomesCard, { borderColor: border, backgroundColor: surface }]}>
                <Text style={[s.outcomesTitle, { color: text }]}>What you'll learn</Text>
                {[
                  'Apply the 28-letter Filipino alphabet correctly',
                  'Distinguish proper uses of tuldik accent marks',
                  'Follow official KWF punctuation rules',
                ].map((outcome) => (
                  <View key={outcome} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Icon name="check-circle" size={18} color={success} />
                    <Text style={[s.outcomesText, { color: text, flex: 1 }]}>{outcome}</Text>
                  </View>
                ))}
              </View>

              {courseQuizzes.length > 0 && (
                <>
                  <SectionHeader title="Assessment" subtitle="One quiz per lesson — unlocks after you complete the lesson" />
                  <View style={{ gap: 8 }}>
                    {courseQuizzes.map((lq) => {
                      const lesson = course.lessons.find((l) => l.id === lq.lessonId);
                      if (!lesson) return null;
                      const unlocked = isComplete(lq.lessonId);
                      const best = bestScore(lq.lessonId);
                      const title = lessonText(lesson, lang).title;
                      return (
                        <Card
                          key={lq.lessonId}
                          onPress={unlocked ? () => router.push({ pathname: '/quiz/[courseId]', params: { courseId: course.id, lessonId: lq.lessonId } }) : undefined}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={[s.quizIcon, { backgroundColor: `${unlocked ? accent : muted}26` }]}>
                            <Icon name={unlocked ? 'quiz' : 'lock'} size={22} color={unlocked ? accent : muted} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text numberOfLines={1} style={[s.quizTitle, { color: unlocked ? text : muted }]}>
                              {lesson.order}. {title}
                            </Text>
                            <Text style={[s.courseMeta, { color: muted }]}>
                              {unlocked
                                ? `${lq.questions.length} question${lq.questions.length === 1 ? '' : 's'}${best > 0 ? ` · Best ${best}%` : ''}`
                                : 'Complete the lesson to unlock'}
                            </Text>
                          </View>
                          {unlocked ? <Icon name="chevron-right" size={20} /> : null}
                        </Card>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Curriculum */}
          {activeTab === 'curriculum' && (
            <View style={{ gap: 8 }}>
              <SectionHeader
                title="Curriculum"
                subtitle={`${statuses.filter(({ status }) => status === 'completed').length} of ${course.lessons.length} lessons complete`}
              />
              {statuses.map(({ lesson, status }, idx) => {
                const prevDone = idx > 0 && isComplete(course.lessons[idx - 1].id);
                const unlockAt = status === 'locked' && prevDone ? unlockAtFor(course.lessons, lesson.id) : null;
                const note = status === 'locked'
                  ? unlockAt ? `Available in ${minsLabel(Math.max(0, unlockAt - now))}` : 'Complete the previous lesson'
                  : undefined;
                return (
                  <LessonListItem
                    key={lesson.id}
                    lesson={{ ...lesson, status, title: lessonText(lesson, lang).title }}
                    note={note}
                    onPress={status !== 'locked'
                      ? () => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })
                      : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
      </Screen>

      {/* Sticky CTA */}
      <View style={[s.cta, { borderTopColor: border, backgroundColor: surface }]}>
        <Button
          variant="primary"
          label={ctaLabel}
          disabled={timeLocked || !ctaTarget}
          onPress={() => ctaTarget && router.push({ pathname: '/lesson/[id]', params: { id: ctaTarget.lesson.id } })}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heroIcon: { height: 64, width: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  courseTitle: { fontFamily: 'SpaceMono_700Bold', fontSize: 20 },
  courseMeta: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  bodyText: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  langToggle: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 2 },
  langBtn: { borderRadius: 999, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  langText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, position: 'relative' },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 14, paddingBottom: 8 },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  outcomesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  outcomesTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  outcomesText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  quizIcon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  quizTitle: { fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  cta: { borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});
