import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { getMonthMoods } from '../../lib/mood';
import { MoodEntry, MoodLevel, getMoodOption } from '../../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, getMoodColor } from '../../lib/theme';
import { ja } from '../../i18n/ja';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// Duolingo風のナビゲーションボタン
const NavButton: React.FC<{ direction: 'left' | 'right'; onPress: () => void }> = ({ direction, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={1}
    >
      <Animated.View style={[styles.navButton, animatedStyle]}>
        <Text style={styles.navButtonText}>{direction === 'left' ? '◀' : '▶'}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 日付セル
const DayCell: React.FC<{
  day: number | null;
  mood?: MoodEntry;
  isToday: boolean;
}> = ({ day, mood, isToday }) => {
  if (day === null) {
    return <View style={styles.dayCell} />;
  }

  const moodColor = mood ? getMoodColor(mood.level) : undefined;

  return (
    <View style={[styles.dayCell, isToday && styles.todayCell]}>
      <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
      <View style={[styles.moodCircle, mood && { backgroundColor: moodColor }]}>
        {mood ? (
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        ) : (
          <View style={styles.emptyDot} />
        )}
      </View>
    </View>
  );
};

// 統計カード
const StatCard: React.FC<{
  value: string | number;
  label: string;
  color?: string;
  emoji?: boolean;
}> = ({ value, label, color = colors.primary, emoji = false }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Text style={[styles.statValue, emoji && styles.statEmoji, { color }]}>
        {value}
      </Text>
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 月の気分データを読み込み
  const loadMoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMonthMoods(year, month);
      setMoods(data);
    } catch (error) {
      console.error('気分データの取得に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadMoods();
  }, [loadMoods]);

  // 前月へ
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  // 翌月へ
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  // カレンダーの日付配列を生成
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (number | null)[] = [];

    // 前月の空白
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // 特定日の気分を取得
  const getMoodForDay = (day: number): MoodEntry | undefined => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return moods.find((m) => m.date === dateStr);
  };

  // 統計計算
  const getStats = () => {
    if (moods.length === 0) return { count: 0, average: 0, best: 0, moodCounts: {} };

    const total = moods.reduce((sum, m) => sum + m.level, 0);
    const average = Math.round(total / moods.length);
    const best = Math.max(...moods.map((m) => m.level));

    const moodCounts: { [key: number]: number } = {};
    moods.forEach((m) => {
      moodCounts[m.level] = (moodCounts[m.level] || 0) + 1;
    });

    return { count: moods.length, average, best, moodCounts };
  };

  const calendarDays = generateCalendarDays();
  const stats = getStats();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 月選択ヘッダー */}
      <View style={styles.header}>
        <NavButton direction="left" onPress={goToPrevMonth} />
        <View style={styles.monthContainer}>
          <Text style={styles.yearText}>{year}年</Text>
          <Text style={styles.monthTitle}>{month}月</Text>
        </View>
        <NavButton direction="right" onPress={goToNextMonth} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {/* カレンダーカード */}
          <View style={styles.calendarCard}>
            {/* 曜日ヘッダー */}
            <View style={styles.weekdayHeader}>
              {WEEKDAYS.map((day, index) => (
                <View key={day} style={styles.weekdayCell}>
                  <Text
                    style={[
                      styles.weekdayText,
                      index === 0 && styles.sundayText,
                      index === 6 && styles.saturdayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* カレンダーグリッド */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const mood = day ? getMoodForDay(day) : undefined;
                const isToday =
                  day === new Date().getDate() &&
                  month === new Date().getMonth() + 1 &&
                  year === new Date().getFullYear();

                return (
                  <DayCell key={index} day={day} mood={mood} isToday={isToday} />
                );
              })}
            </View>
          </View>

          {/* 統計セクション */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>今月の記録</Text>
            <View style={styles.statsRow}>
              <StatCard
                value={stats.count}
                label="記録日数"
                color={colors.primary}
              />
              <StatCard
                value={`${Math.round((stats.count / daysInMonth) * 100)}%`}
                label="記録率"
                color={colors.accent.blue}
              />
              {stats.count > 0 && (
                <StatCard
                  value={getMoodOption(stats.average as MoodLevel)?.emoji || '-'}
                  label="平均気分"
                  color={getMoodColor(stats.average)}
                  emoji
                />
              )}
            </View>
          </View>

          {/* 気分分布 */}
          {stats.count > 0 && (
            <View style={styles.distributionSection}>
              <Text style={styles.sectionTitle}>気分の分布</Text>
              <View style={styles.distributionCard}>
                {[5, 4, 3, 2, 1].map((level) => {
                  const count = stats.moodCounts[level] || 0;
                  const percentage = (count / stats.count) * 100;
                  const moodOption = getMoodOption(level as MoodLevel);

                  return (
                    <View key={level} style={styles.distributionRow}>
                      <Text style={styles.distributionEmoji}>{moodOption.emoji}</Text>
                      <View style={styles.distributionBarContainer}>
                        <Animated.View
                          entering={FadeIn.delay(level * 100)}
                          style={[
                            styles.distributionBar,
                            {
                              width: `${percentage}%`,
                              backgroundColor: getMoodColor(level),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.distributionCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  navButtonText: {
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  monthContainer: {
    alignItems: 'center',
  },
  yearText: {
    fontSize: fontSize.sm,
    color: colors.text.white,
    opacity: 0.8,
  },
  monthTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  loader: {
    marginTop: 50,
  },
  calendarCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    ...shadows.lg,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekdayText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
  },
  sundayText: {
    color: colors.accent.red,
  },
  saturdayText: {
    color: colors.accent.blue,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  todayCell: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
  },
  dayNumber: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  todayNumber: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  moodCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: fontSize.md,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  statsSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statEmoji: {
    fontSize: fontSize.xxl,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  distributionSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  distributionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  distributionEmoji: {
    fontSize: fontSize.xl,
    width: 36,
  },
  distributionBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.border,
    borderRadius: 10,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 10,
  },
  distributionCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    width: 24,
    textAlign: 'right',
  },
});
