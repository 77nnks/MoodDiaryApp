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
} from 'react-native-reanimated';
import { SurfWave } from '../../components/SurfWave';
import { getMonthMoods, getYearMonthlyAverages } from '../../lib/mood';
import { MoodEntry } from '../../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../lib/theme';
import { ja } from '../../i18n/ja';

type ViewMode = 'month' | 'year';

// Duolingo風トグルボタン
const ViewToggle: React.FC<{
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}> = ({ viewMode, onChange }) => {
  const indicatorPosition = useSharedValue(viewMode === 'month' ? 0 : 1);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value * 120 }],
  }));

  const handlePress = (mode: ViewMode) => {
    indicatorPosition.value = withSpring(mode === 'month' ? 0 : 1, {
      damping: 15,
      stiffness: 150,
    });
    onChange(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <Animated.View style={[styles.toggleIndicator, indicatorStyle]} />
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => handlePress('month')}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>
          {ja.surf.monthView}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => handlePress('year')}
        activeOpacity={0.8}
      >
        <Text style={[styles.toggleText, viewMode === 'year' && styles.toggleTextActive]}>
          {ja.surf.yearView}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ナビゲーションボタン
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

export default function SurfScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<{ label: string; value: number }[]>([]);
  const [yearData, setYearData] = useState<{ label: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 月データを読み込み
  const loadMonthData = useCallback(async () => {
    try {
      const moods = await getMonthMoods(year, month);
      const daysInMonth = new Date(year, month, 0).getDate();

      // 日ごとのデータを生成
      const data: { label: string; value: number }[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const mood = moods.find((m) => m.date === dateStr);
        data.push({
          label: String(day),
          value: mood?.level || 0,
        });
      }
      setMonthData(data);
    } catch (error) {
      console.error('月データの取得に失敗しました:', error);
    }
  }, [year, month]);

  // 年データを読み込み
  const loadYearData = useCallback(async () => {
    try {
      const averages = await getYearMonthlyAverages(year);
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

      const data = averages.map((a, i) => ({
        label: monthNames[i],
        value: Math.round(a.average) || 0,
      }));
      setYearData(data);
    } catch (error) {
      console.error('年データの取得に失敗しました:', error);
    }
  }, [year]);

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadMonthData(), loadYearData()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadMonthData, loadYearData]);

  // 前の期間へ
  const goToPrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 2, 1));
    } else {
      setCurrentDate(new Date(year - 1, month - 1, 1));
    }
  };

  // 次の期間へ
  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month, 1));
    } else {
      setCurrentDate(new Date(year + 1, month - 1, 1));
    }
  };

  const periodLabel = viewMode === 'month' ? `${month}月` : `${year}年`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ビュー切り替えタブ */}
      <View style={styles.toggleWrapper}>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </View>

      {/* 期間選択 */}
      <View style={styles.periodSelector}>
        <NavButton direction="left" onPress={goToPrev} />
        <View style={styles.periodContainer}>
          {viewMode === 'month' && <Text style={styles.yearText}>{year}年</Text>}
          <Text style={styles.periodLabel}>{periodLabel}</Text>
        </View>
        <NavButton direction="right" onPress={goToNext} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          {/* サーフィン波グラフ */}
          <View style={styles.waveContainer}>
            <SurfWave
              data={viewMode === 'month' ? monthData : yearData}
              title={
                viewMode === 'month'
                  ? `${month}月の気分の波`
                  : `${year}年の気分の波`
              }
              showSurfer
            />
          </View>

          {/* 説明カード */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoEmoji}>🏄</Text>
              <Text style={styles.infoTitle}>サーフィンの見方</Text>
            </View>
            <Text style={styles.infoText}>
              あなたの気分が波になりました！{'\n'}
              気分が良い日は大きな波、気分が悪い日は小さな波として表示されます。
            </Text>
          </View>

          {/* ティップスカード */}
          <View style={styles.tipsCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoEmoji}>💡</Text>
              <Text style={styles.tipsTitle}>ヒント</Text>
            </View>
            <Text style={styles.tipsText}>
              毎日の気分を記録して、自分の波を観察しよう。
              波の流れを見ることで、自分のリズムが見えてくるかも？
            </Text>
          </View>
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
  toggleWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: 4,
    position: 'relative',
    ...shadows.md,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 120,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  toggleButton: {
    width: 120,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.white,
    fontWeight: fontWeight.bold,
  },
  periodSelector: {
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
  periodContainer: {
    alignItems: 'center',
  },
  yearText: {
    fontSize: fontSize.sm,
    color: colors.text.white,
    opacity: 0.8,
  },
  periodLabel: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  loader: {
    marginTop: 50,
  },
  waveContainer: {
    paddingHorizontal: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoEmoji: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  infoTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  tipsCard: {
    backgroundColor: colors.accent.yellow,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...shadows.md,
  },
  tipsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  tipsText: {
    fontSize: fontSize.md,
    color: colors.text.dark,
    lineHeight: 24,
  },
});
