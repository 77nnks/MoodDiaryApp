import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { MoodSelector } from '../../components/MoodSelector';
import { saveMood, getTodayMood, getMonthMoods, getToday } from '../../lib/mood';
import { MoodLevel, getMoodOption } from '../../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, getMoodColor } from '../../lib/theme';
import { ja } from '../../i18n/ja';

// クロミ風キャラクターコンポーネント
const KuromiCharacter: React.FC<{ mood?: MoodLevel; celebrating?: boolean }> = ({ mood, celebrating }) => {
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (celebrating) {
      bounce.value = withSequence(
        withTiming(-20, { duration: 150 }),
        withSpring(0, { damping: 4, stiffness: 200 })
      );
    }
  }, [celebrating]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const getMouthPath = () => {
    if (!mood) return 'M -6 8 Q 0 10 6 8'; // 普通
    if (mood >= 4) return 'M -6 6 Q 0 14 6 6'; // 嬉しい
    if (mood <= 2) return 'M -6 10 Q 0 6 6 10'; // 悲しい
    return 'M -6 8 Q 0 10 6 8';
  };

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={80} height={100} viewBox="-40 -50 80 100">
        {/* 耳（左） */}
        <Path
          d="M -18 -35 Q -22 -55 -12 -60 Q -4 -58 -8 -38"
          fill="#2D2D2D"
          stroke="#1A1A1A"
          strokeWidth={2}
        />
        <Path d="M -15 -38 Q -17 -50 -11 -54 Q -6 -52 -9 -40" fill="#FF69B4" />

        {/* 耳（右） */}
        <Path
          d="M 18 -35 Q 22 -55 12 -60 Q 4 -58 8 -38"
          fill="#2D2D2D"
          stroke="#1A1A1A"
          strokeWidth={2}
        />
        <Path d="M 15 -38 Q 17 -50 11 -54 Q 6 -52 9 -40" fill="#FF69B4" />

        {/* 顔（白） */}
        <Circle cx={0} cy={-10} r={22} fill="#FFFFFF" stroke="#333" strokeWidth={2} />

        {/* フード */}
        <Path
          d="M -22 -15 Q -24 -30 -16 -35 L -6 -38 L 6 -38 L 16 -35 Q 24 -30 22 -15 Q 14 -22 0 -25 Q -14 -22 -22 -15"
          fill="#2D2D2D"
          stroke="#1A1A1A"
          strokeWidth={1}
        />

        {/* 目（左） */}
        <Ellipse cx={-8} cy={-12} rx={5} ry={6} fill="#333" />
        <Circle cx={-9} cy={-14} r={2} fill="#FFF" />
        <Circle cx={-6} cy={-10} r={1} fill="#FFF" />

        {/* 目（右） */}
        <Ellipse cx={8} cy={-12} rx={5} ry={6} fill="#333" />
        <Circle cx={7} cy={-14} r={2} fill="#FFF" />
        <Circle cx={10} cy={-10} r={1} fill="#FFF" />

        {/* 頬 */}
        <Ellipse cx={-16} cy={-4} rx={4} ry={3} fill="#FFB6C1" fillOpacity={0.7} />
        <Ellipse cx={16} cy={-4} rx={4} ry={3} fill="#FFB6C1" fillOpacity={0.7} />

        {/* 口 */}
        <Path d={getMouthPath()} stroke="#333" strokeWidth={2.5} fill="none" />
        {/* 牙 */}
        <Path d="M -3 8 L -2 12" stroke="#333" strokeWidth={1.5} fill="none" />

        {/* 体 */}
        <Path
          d="M -12 12 L -16 35 L 16 35 L 12 12 Q 0 8 -12 12"
          fill="#2D2D2D"
          stroke="#1A1A1A"
          strokeWidth={1}
        />
        <Circle cx={0} cy={22} r={4} fill="#FF69B4" />
      </Svg>
    </Animated.View>
  );
};

// ストリーク（連続日数）表示コンポーネント
const StreakDisplay: React.FC<{ days: number }> = ({ days }) => {
  return (
    <View style={styles.streakContainer}>
      <View style={styles.streakBadge}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakCount}>{days}</Text>
      </View>
      <Text style={styles.streakLabel}>連続記録</Text>
    </View>
  );
};

// 週間プログレスコンポーネント
const WeekProgress: React.FC<{ moods: { [key: string]: number } }> = ({ moods }) => {
  const today = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];

  const getWeekDates = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        day: days[date.getDay()],
        date: dateStr,
        isToday: i === 0,
        mood: moods[dateStr],
      });
    }
    return result;
  };

  const weekData = getWeekDates();

  return (
    <View style={styles.weekContainer}>
      <Text style={styles.weekTitle}>今週の記録</Text>
      <View style={styles.weekRow}>
        {weekData.map((item, index) => (
          <View key={index} style={styles.dayColumn}>
            <View
              style={[
                styles.dayCircle,
                item.mood && { backgroundColor: getMoodColor(item.mood) },
                item.isToday && styles.dayCircleToday,
              ]}
            >
              {item.mood ? (
                <Text style={styles.dayMoodEmoji}>
                  {getMoodOption(item.mood as MoodLevel)?.emoji}
                </Text>
              ) : (
                <View style={styles.dayEmpty} />
              )}
            </View>
            <Text style={[styles.dayLabel, item.isToday && styles.dayLabelToday]}>
              {item.day}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [todayRegistered, setTodayRegistered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [weekMoods, setWeekMoods] = useState<{ [key: string]: number }>({});
  const [celebrating, setCelebrating] = useState(false);

  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  const formattedDate = new Date().toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 今日の気分とストリークを読み込み
  const loadData = useCallback(async () => {
    try {
      // 今日の気分
      const mood = await getTodayMood();
      if (mood) {
        setSelectedMood(mood.level);
        setTodayRegistered(true);
      }

      // 今月の気分（週間表示用）
      const now = new Date();
      const monthMoods = await getMonthMoods(now.getFullYear(), now.getMonth() + 1);
      const moodMap: { [key: string]: number } = {};
      monthMoods.forEach((m) => {
        moodMap[m.date] = m.level;
      });
      setWeekMoods(moodMap);

      // ストリーク計算
      let streakCount = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (moodMap[dateStr]) {
          streakCount++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(streakCount);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 気分選択時の処理
  const handleMoodSelect = async (level: MoodLevel) => {
    setIsLoading(true);
    try {
      await saveMood(level);
      setSelectedMood(level);
      const wasNew = !todayRegistered;
      setTodayRegistered(true);

      // 週間データを更新
      const today = getToday();
      setWeekMoods((prev) => ({ ...prev, [today]: level }));

      // ストリーク更新
      if (wasNew) {
        setStreak((prev) => prev + 1);
      }

      // お祝いアニメーション
      setCelebrating(true);
      successScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      successOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1500, withTiming(0, { duration: 300 }))
      );

      setTimeout(() => setCelebrating(false), 500);
    } catch (error) {
      Alert.alert('エラー', '気分の保存に失敗しました。もう一度お試しください。');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successOpacity.value,
  }));

  const moodOption = selectedMood ? getMoodOption(selectedMood) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>こんにちは！</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <StreakDisplay days={streak} />
        </View>
      </View>

      {/* キャラクターセクション */}
      <View style={styles.characterSection}>
        <KuromiCharacter mood={selectedMood} celebrating={celebrating} />
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>
            {selectedMood
              ? moodOption && moodOption.level >= 4
                ? 'いい感じだね！'
                : moodOption && moodOption.level <= 2
                ? '大丈夫？無理しないでね'
                : '今日も記録してえらい！'
              : '今日の気分を\n教えてね！'}
          </Text>
        </View>
      </View>

      {/* メインカード */}
      <View style={styles.mainCard}>
        <MoodSelector
          selectedLevel={selectedMood}
          onSelect={handleMoodSelect}
          disabled={isLoading}
        />

        {/* 現在の気分表示 */}
        {selectedMood && (
          <View style={[styles.currentMoodContainer, { backgroundColor: getMoodColor(selectedMood) + '20' }]}>
            <Text style={styles.currentMoodEmoji}>{moodOption?.emoji}</Text>
            <Text style={[styles.currentMoodLabel, { color: getMoodColor(selectedMood) }]}>
              {todayRegistered ? '記録済み' : ''} {moodOption?.label}
            </Text>
          </View>
        )}
      </View>

      {/* 週間プログレス */}
      <View style={styles.progressCard}>
        <WeekProgress moods={weekMoods} />
      </View>

      {/* 成功メッセージ */}
      <Animated.View style={[styles.successOverlay, successAnimatedStyle]}>
        <View style={styles.successContent}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successText}>記録完了！</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.text.white,
    opacity: 0.8,
    marginTop: 4,
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.streak.fire,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  streakEmoji: {
    fontSize: fontSize.lg,
    marginRight: 4,
  },
  streakCount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  streakLabel: {
    fontSize: fontSize.xs,
    color: colors.text.white,
    opacity: 0.8,
    marginTop: 4,
  },
  characterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  speechBubble: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    maxWidth: 180,
    ...shadows.md,
  },
  speechText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.lg,
    ...shadows.lg,
  },
  currentMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  currentMoodEmoji: {
    fontSize: fontSize.xxxl,
  },
  currentMoodLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  progressCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.md,
  },
  weekContainer: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  dayMoodEmoji: {
    fontSize: fontSize.lg,
  },
  dayEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  successOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  successContent: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  successEmoji: {
    fontSize: fontSize.huge,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
