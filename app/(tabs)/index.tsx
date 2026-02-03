import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { MoodSelector } from '../../components/MoodSelector';
import { saveMood, getTodayMood, getToday } from '../../lib/mood';
import { MoodLevel, getMoodOption } from '../../types';
import { ja } from '../../i18n/ja';

export default function HomeScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [todayRegistered, setTodayRegistered] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const today = getToday();
  const formattedDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 今日の気分を読み込み
  const loadTodayMood = useCallback(async () => {
    try {
      const mood = await getTodayMood();
      if (mood) {
        setSelectedMood(mood.level);
        setTodayRegistered(true);
      }
    } catch (error) {
      console.error('今日の気分の取得に失敗しました:', error);
    }
  }, []);

  useEffect(() => {
    loadTodayMood();
  }, [loadTodayMood]);

  // 気分選択時の処理
  const handleMoodSelect = async (level: MoodLevel) => {
    setIsLoading(true);
    try {
      await saveMood(level);
      setSelectedMood(level);
      const wasRegistered = todayRegistered;
      setTodayRegistered(true);

      // 成功アニメーション
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      Alert.alert('エラー', '気分の保存に失敗しました。もう一度お試しください。');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const moodOption = selectedMood ? getMoodOption(selectedMood) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 日付表示 */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* タイトル */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{ja.home.title}</Text>
          <Text style={styles.subtitle}>{ja.home.subtitle}</Text>
        </View>

        {/* 気分セレクター */}
        <View style={styles.selectorContainer}>
          <MoodSelector
            selectedLevel={selectedMood}
            onSelect={handleMoodSelect}
            disabled={isLoading}
          />
        </View>

        {/* 現在の気分表示 */}
        {selectedMood && (
          <View style={styles.currentMoodContainer}>
            <Text style={styles.currentMoodEmoji}>{moodOption?.emoji}</Text>
            <Text style={styles.currentMoodLabel}>
              今日の気分: {moodOption?.label}
            </Text>
          </View>
        )}

        {/* 成功メッセージ */}
        <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
          <Text style={styles.successText}>
            {todayRegistered ? ja.home.updated : ja.home.registered}
          </Text>
        </Animated.View>
      </View>

      {/* 波の装飾 */}
      <View style={styles.waveDecoration}>
        <Text style={styles.waveText}>〜〜〜🏄〜〜〜</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  selectorContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  currentMoodContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  currentMoodEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  currentMoodLabel: {
    fontSize: 18,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  successMessage: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    backgroundColor: '#E8FAF8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  waveDecoration: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  waveText: {
    fontSize: 32,
    opacity: 0.3,
  },
});
