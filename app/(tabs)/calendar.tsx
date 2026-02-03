import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getMonthMoods } from '../../lib/mood';
import { MoodEntry, getMoodOption } from '../../types';
import { ja } from '../../i18n/ja';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

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

  const calendarDays = generateCalendarDays();

  return (
    <SafeAreaView style={styles.container}>
      {/* 月選択ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {year}年 {month}月
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4ECDC4" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 曜日ヘッダー */}
          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((day, index) => (
              <Text
                key={day}
                style={[
                  styles.weekdayText,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}
              >
                {day}
              </Text>
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
                <View
                  key={index}
                  style={[styles.dayCell, isToday && styles.todayCell]}
                >
                  {day !== null && (
                    <>
                      <Text
                        style={[styles.dayNumber, isToday && styles.todayNumber]}
                      >
                        {day}
                      </Text>
                      {mood ? (
                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      ) : (
                        <Text style={styles.noMood}>-</Text>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {/* 月の統計 */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>今月の記録</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{moods.length}</Text>
                <Text style={styles.statLabel}>記録日数</Text>
              </View>
              {moods.length > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {getMoodOption(
                      Math.round(
                        moods.reduce((sum, m) => sum + m.level, 0) / moods.length
                      ) as 1 | 2 | 3 | 4 | 5
                    ).emoji}
                  </Text>
                  <Text style={styles.statLabel}>平均気分</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 18,
    color: '#4ECDC4',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  loader: {
    marginTop: 50,
  },
  scrollContent: {
    padding: 20,
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sundayText: {
    color: '#FF6B6B',
  },
  saturdayText: {
    color: '#4ECDC4',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#E8FAF8',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  todayNumber: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  moodEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  noMood: {
    fontSize: 16,
    color: '#DDD',
    marginTop: 2,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
