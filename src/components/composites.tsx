/**
 * src/components/composites.tsx — Layer-2 composites, StyleSheet-only (no NativeWind).
 */
import Markdown from 'react-native-markdown-display';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Toggle, useThemeColor } from '@/src/components/primitives';

import type { Achievement } from '@/types/achievement';
import type { Course, Lesson, MaterialIconName } from '@/types/course';
import type { AppNotification } from '@/types/notification';

const withAlpha = (hex: string, alpha: string) => `${hex}${alpha}`;

/* ── CategoryChips ──────────────────────────────────────────────────────────── */

export type CategoryChipItem = {
  id: string;
  label: string;
  icon?: MaterialIconName;
  selected: boolean;
};

export function CategoryChips({
  categories,
  onToggle,
  grid = false,
  style,
}: {
  categories: CategoryChipItem[];
  onToggle: (id: string) => void;
  grid?: boolean;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  return (
    <View style={[cs.chipsRow, style]}>
      {categories.map((category) => {
        const active = category.selected;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={category.label}
            onPress={() => onToggle(category.id)}
            style={[
              cs.chip,
              { borderColor: active ? accent : border, backgroundColor: active ? withAlpha(accent, '33') : surface },
              grid && cs.chipGrid,
            ]}>
            {category.icon ? <Icon name={category.icon} size={20} color={active ? accent : undefined} /> : null}
            <Text style={[cs.chipLabel, { color: active ? accent : muted }]}>{category.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── SectionHeader ──────────────────────────────────────────────────────────── */

export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
  style,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  style?: object;
}) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const accent = useThemeColor('accent');
  return (
    <View style={[cs.sectionHeader, style]}>
      <View style={cs.flex1}>
        <Text style={[cs.sectionTitle, { color: text }]}>{title}</Text>
        {subtitle ? <Text style={[cs.sectionSub, { color: muted }]}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onAction} style={cs.actionBtn}>
          <Text style={[cs.actionLabel, { color: accent }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  body,
  action,
  style,
}: {
  icon: MaterialIconName;
  title: string;
  body?: string;
  action?: ReactNode;
  style?: object;
}) {
  const muted = useThemeColor('textMuted');
  return (
    <View style={[cs.empty, style]}>
      <Icon name={icon} size={44} color={muted} />
      <Text style={[cs.emptyTitle, { color: muted }]}>{title}</Text>
      {body ? <Text style={[cs.emptyBody, { color: muted }]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

/* ── CourseCard ─────────────────────────────────────────────────────────────── */

export function CourseCard({
  course,
  variant = 'list',
  progress,
  onPress,
  style,
}: {
  course: Course;
  variant?: 'list' | 'compact';
  progress?: number;
  onPress?: () => void;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const fill = Math.max(0, Math.min(1, progress ?? course.progress));
  const pct = Math.round(fill * 100);
  const completed = fill >= 1;

  if (variant === 'compact') {
    return (
      <Card onPress={onPress} style={[{ width: 240, flexShrink: 0 }, style]}>
        <View style={{ gap: 8 }}>
          <View style={[cs.iconTile, { backgroundColor: withAlpha(accent, '26') }]}>
            <Icon name={course.icon} size={24} color={accent} />
          </View>
          <Text numberOfLines={1} style={[cs.courseTitle, { color: text }]}>{course.title}</Text>
          <Text style={[cs.courseMeta, { color: muted }]}>{pct}% complete · {course.duration}</Text>
          <ProgressBar value={fill} />
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={style}>
      <View style={{ gap: 12 }}>
        <Text style={[cs.courseCategory, { color: accent }]}>{course.category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[cs.iconTileLg, { backgroundColor: withAlpha(accent, '26') }]}>
            <Icon name={course.icon} size={26} color={accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text numberOfLines={1} style={[cs.courseTitle, { color: text }]}>{course.title}</Text>
            <Text style={[cs.courseMeta, { color: muted }]}>{course.instructor}</Text>
          </View>
          {completed ? <Badge variant="success" label="Completed" /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[cs.courseMeta, { color: muted }]}>{pct}% complete</Text>
          <Text style={[cs.courseMeta, { color: muted }]}>·</Text>
          <Text style={[cs.courseMeta, { color: muted }]}>{course.duration}</Text>
        </View>
        <ProgressBar value={fill} />
      </View>
    </Card>
  );
}

/* ── LessonListItem ─────────────────────────────────────────────────────────── */

const LESSON_STATUS_ICON: Record<Lesson['status'], MaterialIconName> = {
  completed: 'check-circle',
  current: 'play-arrow',
  locked: 'lock',
};

export function LessonListItem({
  lesson,
  onPress,
  note,
  style,
}: {
  lesson: Lesson;
  onPress?: () => void;
  note?: string;
  style?: object;
}) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const tabDefault = useThemeColor('tabDefault');
  const unlocked = lesson.status !== 'locked';
  const statusColor =
    lesson.status === 'completed' ? success : lesson.status === 'current' ? accent : tabDefault;

  return (
    <Card onPress={unlocked ? onPress : undefined} style={[cs.lessonRow, style]}>
      <Icon name={LESSON_STATUS_ICON[lesson.status]} size={22} color={statusColor} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[cs.lessonTitle, { color: unlocked ? text : muted }]}>
          {lesson.title}
        </Text>
        {note ? <Text style={[cs.lessonNote, { color: muted }]}>{note}</Text> : null}
      </View>
      <Text style={[cs.lessonDur, { color: muted }]}>{lesson.durationMin} min</Text>
    </Card>
  );
}

/* ── StreakCard ─────────────────────────────────────────────────────────────── */

export function StreakCard({
  streakDays,
  goalPct,
  weekData,
  style,
}: {
  streakDays: number;
  goalPct: number;
  weekData: readonly boolean[];
  style?: object;
}) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const accent = useThemeColor('accent');
  const border = useThemeColor('border');
  const star = useThemeColor('star');
  const heatClamped = [...weekData.slice(0, 7)];
  while (heatClamped.length < 7) heatClamped.unshift(false);

  return (
    <Card style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="local-fire-department" size={24} color={star} />
          <Text style={[cs.streakLabel, { color: text }]}>{streakDays}-day streak</Text>
        </View>
        <Text style={[cs.streakGoal, { color: muted }]}>Today's goal {Math.round(goalPct)}%</Text>
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {heatClamped.map((active, index) => (
          <View
            key={`${index}-${active ? 'on' : 'off'}`}
            style={[cs.heatCell, { flex: 1, backgroundColor: active ? accent : border }]}
          />
        ))}
      </View>
    </Card>
  );
}

/* ── LessonBody ─────────────────────────────────────────────────────────────── */

export function LessonBody({ content, style }: { content: string; style?: object }) {
  const colors = {
    text: useThemeColor('text'),
    muted: useThemeColor('textMuted'),
    accent: useThemeColor('accent'),
    border: useThemeColor('border'),
    surface: useThemeColor('surface'),
  };
  return (
    <View style={style}>
      <Markdown style={markdownStyles(colors)}>{content}</Markdown>
    </View>
  );
}

function markdownStyles({ text, muted, accent, border, surface }: Record<string, string>) {
  return {
    body: { color: text, fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
    heading1: { color: text, fontFamily: 'SpaceMono_700Bold', fontSize: 28, lineHeight: 34, marginBottom: 8 },
    heading2: { color: text, fontFamily: 'SpaceMono_700Bold', fontSize: 22, lineHeight: 28, marginTop: 16, marginBottom: 8 },
    heading3: { color: text, fontFamily: 'SpaceMono_700Bold', fontSize: 18, lineHeight: 24, marginTop: 12, marginBottom: 4 },
    paragraph: { marginTop: 8 },
    link: { color: accent, textDecorationLine: 'underline' as const },
    strong: { color: text, fontFamily: 'Inter_600SemiBold' },
    blockquote: { borderLeftColor: accent, borderLeftWidth: 2, paddingLeft: 12, color: muted, fontStyle: 'italic' as const },
    codeBlock: { backgroundColor: surface, borderColor: border, borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'SpaceMono_400Regular' },
    code_inline: { backgroundColor: surface, color: accent, fontFamily: 'SpaceMono_400Regular' },
    hr: { backgroundColor: border, height: 1, marginVertical: 12 },
    list_item: { color: text },
    table: { backgroundColor: surface, borderColor: border, borderWidth: 1 },
  };
}

/* ── StatCard ───────────────────────────────────────────────────────────────── */

export function StatCard({
  icon,
  label,
  value,
  iconColor,
  style,
}: {
  icon: MaterialIconName;
  label: string;
  value: string | number;
  iconColor?: string;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const color = iconColor ?? accent;
  return (
    <Card style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      <View style={[cs.statIcon, { backgroundColor: withAlpha(color, '26') }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[cs.statValue, { color: text }]}>{String(value)}</Text>
        <Text style={[cs.statLabel, { color: muted }]}>{label}</Text>
      </View>
    </Card>
  );
}

/* ── AchievementBadge ───────────────────────────────────────────────────────── */

export function AchievementBadge({
  achievement,
  variant = 'primary',
  style,
}: {
  achievement: Achievement;
  variant?: 'primary' | 'tertiary' | 'locked';
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const star = useThemeColor('star');
  const muted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const text = useThemeColor('text');
  const isLocked = !achievement.earned || variant === 'locked';
  const iconColor = isLocked ? muted : variant === 'tertiary' ? star : accent;

  return (
    <Card style={[cs.achieveCard, isLocked && { opacity: 0.6 }, style]}>
      <View
        style={[cs.achieveIcon, isLocked ? { backgroundColor: border } : { backgroundColor: withAlpha(iconColor, '20') }]}>
        <Icon name={isLocked ? 'lock' : achievement.icon} size={28} color={iconColor} />
      </View>
      <Text numberOfLines={1} style={[cs.achieveName, { color: isLocked ? muted : text }]}>
        {achievement.name}
      </Text>
      <Text style={[cs.achieveDate, { color: muted }]} numberOfLines={1}>
        {achievement.earnedDate ?? (isLocked ? 'Locked' : '')}
      </Text>
    </Card>
  );
}

/* ── QuizOption ─────────────────────────────────────────────────────────────── */

export function QuizOption({
  letter,
  text: optText,
  selected,
  correct,
  showResult,
  onPress,
  disabled = false,
  style,
}: {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  selected: boolean;
  correct: boolean;
  showResult: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const success = useThemeColor('success');
  const danger = useThemeColor('danger');
  const border = useThemeColor('border');
  const textColor = useThemeColor('text');
  const muted = useThemeColor('textMuted');

  const showCorrect = showResult && correct;
  const showWrong = showResult && selected && !correct;

  const borderColor = showCorrect ? success : showWrong ? danger : selected && !showResult ? accent : border;
  const bgColor = showCorrect
    ? withAlpha(success, '20')
    : showWrong
    ? withAlpha(danger, '20')
    : selected && !showResult
    ? withAlpha(accent, '20')
    : 'transparent';

  const letterBg = showCorrect ? success : showWrong ? danger : selected && !showResult ? accent : border;
  const letterTextColor = showCorrect || showWrong || (selected && !showResult) ? '#FFF' : muted;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[cs.quizOption, { borderColor, backgroundColor: bgColor }, style]}>
      <View style={[cs.letterCircle, { backgroundColor: letterBg }]}>
        <Text style={[cs.letterText, { color: letterTextColor }]}>{letter}</Text>
      </View>
      <Text style={[cs.optionText, { color: textColor, flex: 1 }]}>{optText}</Text>
      {showResult && selected && (
        <Icon name={correct ? 'check-circle' : 'cancel'} size={20} color={correct ? success : danger} />
      )}
      {showResult && !selected && correct && <Icon name="check-circle" size={20} color={success} />}
    </Pressable>
  );
}

/* ── NotificationItem ───────────────────────────────────────────────────────── */

export function NotificationItem({
  notification,
  onPress,
  style,
}: {
  notification: AppNotification;
  onPress?: () => void;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const star = useThemeColor('star');
  const muted = useThemeColor('textMuted');
  const text = useThemeColor('text');
  const iconColor =
    notification.type === 'course' ? accent : notification.type === 'achievement' ? star : muted;

  return (
    <Card onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, style]}>
      <View style={[cs.notifIcon, { backgroundColor: withAlpha(iconColor, '20') }]}>
        <Icon name={notification.icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text numberOfLines={1} style={[cs.notifTitle, { color: notification.read ? muted : text, flex: 1 }]}>
            {notification.title}
          </Text>
          {!notification.read && <View style={[cs.unreadDot, { backgroundColor: accent }]} />}
        </View>
        <Text style={[cs.notifBody, { color: muted }]} numberOfLines={2}>{notification.description}</Text>
        <Text style={[cs.notifTime, { color: muted }]}>{notification.time}</Text>
      </View>
    </Card>
  );
}

/* ── SettingsRow ────────────────────────────────────────────────────────────── */

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  locked = false,
  style,
}: {
  icon?: MaterialIconName;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
  locked?: boolean;
  style?: object;
}) {
  const accent = useThemeColor('accent');
  const muted = useThemeColor('textMuted');
  const text = useThemeColor('text');
  const hasToggle = !!toggle;
  const tint = locked ? muted : accent;

  return (
    <Pressable
      onPress={locked || hasToggle ? undefined : onPress}
      disabled={locked}
      accessibilityRole={hasToggle ? 'none' : 'button'}
      accessibilityState={{ disabled: locked }}
      style={[cs.settingsRow, locked && { opacity: 0.6 }, style]}>
      {icon ? (
        <View style={[cs.settingsIcon, { backgroundColor: withAlpha(tint, '15') }]}>
          <Icon name={icon} size={20} color={tint} />
        </View>
      ) : null}
      <Text style={[cs.settingsLabel, { color: locked ? muted : text, flex: 1 }]}>{label}</Text>
      {locked ? (
        <Icon name="lock" size={18} color={muted} />
      ) : hasToggle ? (
        <Toggle value={toggle.value} onValueChange={toggle.onValueChange} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {value ? <Text style={[cs.settingsValue, { color: muted }]}>{value}</Text> : null}
          <Icon name="chevron-right" size={20} />
        </View>
      )}
    </Pressable>
  );
}

// --- Styles ------------------------------------------------------------------

const cs = StyleSheet.create({
  flex1: { flex: 1 },
  // chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  chipGrid: { width: '48%' },
  chipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // section header
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontFamily: 'SpaceMono_700Bold', fontSize: 20 },
  sectionSub: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 2 },
  actionBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  actionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // empty state
  empty: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 48 },
  emptyTitle: { fontFamily: 'SpaceMono_700Bold', fontSize: 18, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
  // course card
  iconTile: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  iconTileLg: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  courseTitle: { fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  courseMeta: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  courseCategory: { fontFamily: 'Inter_400Regular', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  // lesson list item
  lessonRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  lessonTitle: { fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: '500' },
  lessonNote: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  lessonDur: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  // streak
  streakLabel: { fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  streakGoal: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  heatCell: { height: 32, borderRadius: 8 },
  // stat card
  statIcon: { height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  statValue: { fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  // achievement
  achieveCard: { alignItems: 'center', gap: 8, padding: 16 },
  achieveIcon: { height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  achieveName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'center' },
  achieveDate: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center' },
  // quiz option
  quizOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 16, minHeight: 48 },
  letterCircle: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  letterText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  optionText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  // notification
  notifIcon: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999, flexShrink: 0 },
  notifTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  notifBody: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  notifTime: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  unreadDot: { height: 8, width: 8, borderRadius: 999, flexShrink: 0 },
  // settings
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16 },
  settingsIcon: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999, flexShrink: 0 },
  settingsLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  settingsValue: { fontFamily: 'Inter_400Regular', fontSize: 14 },
});
