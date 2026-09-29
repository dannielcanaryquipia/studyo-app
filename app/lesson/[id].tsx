import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Icon, Screen, useThemeColor } from '@/src/components/primitives';
import { EmptyState, LessonBody } from '@/src/components/composites';
import { courses } from '@/src/data/courses';
import { lessonText, useContentLang } from '@/hooks/useContentLang';
import { useProgressStore } from '@/hooks/useProgressStore';
import { splitLessonSections } from '@/lib/lesson-sections';

const minsLabel = (ms: number) => `${Math.max(1, Math.ceil(ms / 60000))} min`;

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isComplete, toggleComplete, statusFor, unlockAtFor } = useProgressStore();
  const { lang } = useContentLang();

  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const border = useThemeColor('border');
  const background = useThemeColor('background');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  const courseId = (params.id ?? '').split(':')[0];
  const course = useMemo(() => courses.find((c) => c.id === courseId), [courseId]);
  const lessonIdx = useMemo(() => course?.lessons.findIndex((l) => l.id === params.id) ?? -1, [course, params.id]);
  const lesson = useMemo(() => (lessonIdx >= 0 ? course?.lessons[lessonIdx] : undefined), [course, lessonIdx]);
  const prev = useMemo(() => (lessonIdx > 0 ? course?.lessons[lessonIdx - 1] : undefined), [course, lessonIdx]);
  const next = useMemo(() => (lessonIdx >= 0 && lessonIdx < (course?.lessons.length ?? 0) - 1 ? course?.lessons[lessonIdx + 1] : undefined), [course, lessonIdx]);

  const lt = lesson ? lessonText(lesson, lang) : { title: '', description: '', content: '' };
  const sections = useMemo(() => splitLessonSections(lt.content), [lt.content]);
  const total = sections.length;
  const done = lesson ? isComplete(lesson.id) : false;

  const [revealed, setRevealed] = useState(1);
  const [trackedId, setTrackedId] = useState(params.id);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (trackedId !== params.id) {
    setTrackedId(params.id);
    setRevealed(done ? Math.max(1, total) : 1);
  }
  if (done && revealed < total) setRevealed(total);
  if (revealed > total && total > 0) setRevealed(total);

  const allRevealed = total <= 1 || revealed >= total;
  const read = allRevealed;
  const progress = total > 0 ? Math.min(1, revealed / total) : 1;

  if (!course || !lesson) {
    return (
      <Screen onBack={() => router.back()}>
        <EmptyState icon="search" title="Lesson not found" body="This lesson isn't in the library yet." />
      </Screen>
    );
  }

  const totalLessons = course.lessons.length;
  const nextLocked = !!next && statusFor(course.lessons, next.id) === 'locked';
  const nextUnlockTime = next ? unlockAtFor(course.lessons, next.id) : null;

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      <Screen onBack={() => router.back()} title={lt.title} progress={progress}>
        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Icon name="schedule" size={14} />
          <Text style={[s.meta, { color: muted }]}>{lesson.durationMin} min</Text>
          <Text style={[s.meta, { color: muted }]}>·</Text>
          <Text style={[s.meta, { color: muted }]}>
            {allRevealed ? `Lesson ${lessonIdx + 1} of ${totalLessons}` : `Section ${revealed} of ${total}`}
          </Text>
          {read && (
            <>
              <Text style={[s.meta, { color: muted }]}>·</Text>
              <Icon name="check-circle" size={14} color={success} />
              <Text style={[s.meta, { color: success }]}>Read</Text>
            </>
          )}
        </View>

        {/* Stepped sections */}
        {sections.slice(0, revealed).map((section, i) => {
          const isActive = !allRevealed && i === revealed - 1;
          const dim = !allRevealed && i < revealed - 1;
          return (
            <View
              key={i}
              style={[
                s.sectionCard,
                { borderColor: isActive ? accent : border, backgroundColor: isActive ? surface : 'transparent' },
                dim && { opacity: 0.45 },
              ]}>
              <LessonBody content={section} />
            </View>
          );
        })}

        {/* Continue button */}
        {!allRevealed && (
          <Pressable
            onPress={() => setRevealed((r) => Math.min(total, r + 1))}
            accessibilityRole="button"
            style={[s.continueBtn, { borderColor: accent, backgroundColor: surface }]}>
            <Text style={[s.continueBtnText, { color: accent }]}>Continue</Text>
            <Icon name="expand-more" size={20} color={accent} />
          </Pressable>
        )}

        {/* Timed lock notice */}
        {done && nextLocked && (
          <View style={[s.timedNotice, { borderColor: border, backgroundColor: surface }]}>
            <Icon name="schedule" size={20} color={accent} />
            <Text style={[s.timedText, { color: muted, flex: 1 }]}>
              {nextUnlockTime
                ? `You've finished this lesson. The next one unlocks in ${minsLabel(Math.max(0, nextUnlockTime - now))}.`
                : "You've finished this lesson."}
            </Text>
          </View>
        )}
      </Screen>

      {/* Sticky nav */}
      <View style={[s.stickyNav, { borderTopColor: border, backgroundColor: surface }]}>
        <Button
          variant="secondary"
          label="Prev"
          disabled={!prev}
          onPress={() => prev && router.replace({ pathname: '/lesson/[id]', params: { id: prev.id } })}
          style={{ minWidth: 72 }}
        />
        <View style={{ flex: 1 }}>
          {read ? (
            <Button
              variant={done ? 'secondary' : 'primary'}
              label={done ? 'Completed' : 'Mark Complete'}
              onPress={() => toggleComplete(lesson.id)}
            />
          ) : (
            <Text style={[s.hintText, { color: muted }]}>Tap Continue to read each section</Text>
          )}
        </View>
        <Button
          variant="ghost"
          label="Next"
          disabled={!next || nextLocked}
          onPress={() => next && !nextLocked && router.replace({ pathname: '/lesson/[id]', params: { id: next.id } })}
          style={{ minWidth: 72 }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, borderWidth: 1, minHeight: 48, paddingHorizontal: 16 },
  continueBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  timedNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  timedText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  stickyNav: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  hintText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
});
