import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Icon, ProgressRing, Screen, useThemeColor } from '@/src/components/primitives';
import { StatCard } from '@/src/components/composites';
import { lessonQuizzes } from '@/src/data/courses';

function gradeLabel(percent: number) {
  if (percent === 100) return 'Excellent!';
  if (percent >= 80) return 'Great job!';
  if (percent >= 70) return 'Good work!';
  if (percent >= 50) return 'Keep going!';
  return 'Try again!';
}

function minsLabel(ms: number) {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string; lessonId: string; score: string; total: string; timeMs: string; answers: string }>();

  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');

  const score = parseInt(params.score ?? '0', 10);
  const total = parseInt(params.total ?? '0', 10);
  const timeMs = parseInt(params.timeMs ?? '0', 10);
  const answers: number[] = useMemo(() => {
    try { return JSON.parse(params.answers ?? '[]'); } catch { return []; }
  }, [params.answers]);

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const quiz = useMemo(() => lessonQuizzes.find((q) => q.lessonId === params.lessonId), [params.lessonId]);

  return (
    <Screen title="Quiz Results" onBack={() => router.replace({ pathname: '/course/[id]', params: { id: params.courseId ?? '' } })}>
      {/* Score hero */}
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        <ProgressRing progress={percent} size={120} strokeWidth={10} />
        <Text style={[s.gradeLabel, { color: text }]}>{gradeLabel(percent)}</Text>
        <Text style={[s.scoreSubtitle, { color: muted }]}>You scored {percent}% on this quiz.</Text>
      </View>

      {/* Stat row */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard style={{ flex: 1 }} icon="check-circle" label="Correct" value={`${score}/${total}`} iconColor={success} />
        <StatCard style={{ flex: 1 }} icon="schedule" label="Time" value={minsLabel(timeMs)} iconColor={accent} />
      </View>

      {/* Answer review */}
      {quiz && quiz.questions.length > 0 && (
        <>
          <Text style={[s.reviewTitle, { color: text }]}>Answer Review</Text>
          <FlatList
            data={quiz.questions}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item: question, index }) => {
              const chosen = answers[index] ?? -1;
              const correct = chosen === question.correctIndex;
              const chosenText = chosen >= 0 ? question.options[chosen]?.text : 'No answer';
              return (
                <Card style={[s.reviewCard, { borderColor: correct ? success : border, borderWidth: 1 }]}>
                  <Text style={[s.questionText, { color: text }]}>
                    {index + 1}. {question.text}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Icon name={correct ? 'check-circle' : 'cancel'} size={16} color={correct ? success : muted} />
                    <Text style={[s.answerLabel, { color: muted }]}>Your answer: </Text>
                    <Text style={[s.answerText, { color: correct ? success : text, flex: 1 }]}>{chosenText}</Text>
                  </View>
                  {question.explanation ? (
                    <Text style={[s.explanationText, { color: muted }]}>{question.explanation}</Text>
                  ) : null}
                </Card>
              );
            }}
          />
        </>
      )}

      {/* CTAs */}
      <View style={{ gap: 10, paddingBottom: 8 }}>
        <Button
          variant="primary"
          label="Retake Quiz"
          onPress={() => router.replace({ pathname: '/quiz/[courseId]', params: { courseId: params.courseId ?? '', lessonId: params.lessonId ?? '' } })}
        />
        <Button
          variant="secondary"
          label="Back to Course"
          onPress={() => router.replace({ pathname: '/course/[id]', params: { id: params.courseId ?? '' } })}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  gradeLabel: { fontFamily: 'SpaceMono_700Bold', fontSize: 24 },
  scoreSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  reviewTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  reviewCard: { gap: 8 },
  questionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  answerLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  answerText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  explanationText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});
