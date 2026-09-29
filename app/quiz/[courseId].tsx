import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, useThemeColor } from '@/src/components/primitives';
import { EmptyState, QuizOption } from '@/src/components/composites';
import { lessonQuizzes } from '@/src/data/courses';
import { useProgressStore } from '@/hooks/useProgressStore';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const { recordQuizResult } = useProgressStore();

  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const background = useThemeColor('background');
  const text = useThemeColor('text');

  const quiz = useMemo(() => lessonQuizzes.find((q) => q.lessonId === params.lessonId), [params.lessonId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  const confirmExit = useCallback(() => {
    Alert.alert('Leave quiz?', 'Your progress will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { confirmExit(); return true; });
    return () => sub.remove();
  }, [confirmExit]);

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Screen onBack={confirmExit}>
        <EmptyState
          icon="quiz"
          title="No quiz available"
          body="The quiz for this lesson has not been authored yet."
          action={<Button variant="secondary" label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;

  const handleSubmit = () => {
    if (selectedIdx === null) return;
    setShowResult(true);
    setAnswers((prev) => [...prev, selectedIdx]);
  };

  const handleNext = () => {
    if (isLast) {
      const finalAnswers = [...answers];
      const score = finalAnswers.reduce((sum, ans, i) => (ans === quiz.questions[i].correctIndex ? sum + 1 : sum), 0);
      const total = quiz.questions.length;
      const percent = Math.round((score / total) * 100);
      const timeMs = Date.now() - startTimeRef.current;
      recordQuizResult(quiz.lessonId, percent);
      router.replace({ pathname: '/quiz/results', params: { courseId: quiz.courseId, lessonId: quiz.lessonId, score: String(score), total: String(total), timeMs: String(timeMs), answers: JSON.stringify(finalAnswers) } });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIdx(null);
      setShowResult(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: background }]}>
      <Screen onBack={confirmExit} title={`Question ${currentIndex + 1} of ${quiz.questions.length}`} scroll={false}>
        {/* Segmented progress */}
        <View style={s.segRow}>
          {quiz.questions.map((_, i) => (
            <View key={i} style={[s.seg, { flex: 1, backgroundColor: i <= currentIndex ? accent : border }]} />
          ))}
        </View>

        {/* Question */}
        <Card style={{ gap: 8 }}>
          <Text style={[s.questionText, { color: text }]}>{question.text}</Text>
        </Card>

        {/* Options */}
        <View style={{ gap: 12 }}>
          {question.options.map((option, i) => (
            <QuizOption
              key={option.letter}
              letter={LETTERS[i] ?? option.letter}
              text={option.text}
              selected={selectedIdx === i}
              correct={i === question.correctIndex}
              showResult={showResult}
              onPress={() => !showResult && setSelectedIdx(i)}
              disabled={showResult}
            />
          ))}
        </View>

        {/* Explanation */}
        {showResult && question.explanation ? (
          <Card variant="filled" style={{ gap: 4 }}>
            <Text style={[s.explanationLabel, { color: accent }]}>Explanation</Text>
            <Text style={[s.explanationText, { color: text }]}>{question.explanation}</Text>
          </Card>
        ) : null}
      </Screen>

      {/* Sticky CTA */}
      <View style={[s.cta, { borderTopColor: border, backgroundColor: surface }]}>
        {!showResult ? (
          <Button variant="primary" label="Submit Answer" disabled={selectedIdx === null} onPress={handleSubmit} />
        ) : (
          <Button variant="primary" label={isLast ? 'See Results' : 'Next Question'} onPress={handleNext} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  segRow: { flexDirection: 'row', gap: 6 },
  seg: { height: 8, borderRadius: 999 },
  questionText: { fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  explanationLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  explanationText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  cta: { borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
});
