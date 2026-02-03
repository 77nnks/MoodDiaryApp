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
import { SurfWave } from '../../components/SurfWave';
import { getMonthMoods, getYearMonthlyAverages } from '../../lib/mood';
import { MoodEntry } from '../../types';
import { ja } from '../../i18n/ja';

type ViewMode = 'month' | 'year';

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

  const periodLabel = viewMode === 'month' ? `${year}年 ${month}月` : `${year}年`;

  return (
    <SafeAreaView style={styles.container}>
      {/* ビュー切り替えタブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'month' && styles.tabActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.tabText, viewMode === 'month' && styles.tabTextActive]}>
            {ja.surf.monthView}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'year' && styles.tabActive]}
          onPress={() => setViewMode('year')}
        >
          <Text style={[styles.tabText, viewMode === 'year' && styles.tabTextActive]}>
            {ja.surf.yearView}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 期間選択 */}
      <View style={styles.periodSelector}>
        <TouchableOpacity onPress={goToPrev} style={styles.navButton}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.periodLabel}>{periodLabel}</Text>
        <TouchableOpacity onPress={goToNext} style={styles.navButton}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4ECDC4" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* サーフィン波グラフ */}
          <SurfWave
            data={viewMode === 'month' ? monthData : yearData}
            title={
              viewMode === 'month'
                ? `${month}月の気分の波 🌊`
                : `${year}年の気分の波 🌊`
            }
            showSurfer
          />

          {/* 説明 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>🏄 サーフィンの見方</Text>
            <Text style={styles.descriptionText}>
              あなたの気分が波になりました！{'\n'}
              気分が良い日は大きな波、{'\n'}
              気分が悪い日は小さな波として表示されます。{'\n'}
              {'\n'}
              サーファー🏄は一番気分が良かった日に乗っています！
            </Text>
          </View>

          {/* ティップス */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 ヒント</Text>
            <Text style={styles.tipsText}>
              毎日の気分を記録して、自分の波を観察しよう。{'\n'}
              波の流れを見ることで、自分のリズムが見えてくるかも？
            </Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 18,
    color: '#4ECDC4',
  },
  periodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    marginTop: 50,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  descriptionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});
