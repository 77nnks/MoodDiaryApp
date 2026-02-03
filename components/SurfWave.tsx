import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SurfWaveProps {
  data: { label: string; value: number }[];
  title: string;
  showSurfer?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 220;
const PADDING = 30;
const ANIMATION_DURATION = 4000; // 4秒で波を渡る

// アニメーション用のサーファーコンポーネント
const AnimatedG = Animated.createAnimatedComponent(G);

export const SurfWave: React.FC<SurfWaveProps> = ({
  data,
  title,
  showSurfer = true,
}) => {
  const animationProgress = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // 波のデータを計算
  const { pathD, wavePoints, hasData } = useMemo(() => {
    if (data.length === 0 || data.every((d) => d.value === 0)) {
      return { pathD: '', wavePoints: [], hasData: false };
    }

    const validData = data.filter((d) => d.value > 0);
    if (validData.length === 0) {
      return { pathD: '', wavePoints: [], hasData: false };
    }

    const chartInnerWidth = CHART_WIDTH - PADDING * 2;
    const chartInnerHeight = CHART_HEIGHT - PADDING * 2 - 20;

    // データポイントを計算
    const points = data.map((d, i) => {
      const x = PADDING + (i / (data.length - 1)) * chartInnerWidth;
      const normalizedValue = d.value > 0 ? (d.value - 1) / 4 : 0;
      const y =
        d.value > 0
          ? PADDING + chartInnerHeight * (1 - normalizedValue)
          : CHART_HEIGHT - PADDING - 20;
      return { x, y, value: d.value, index: i };
    });

    // ベジェ曲線でスムーズな波を描画
    let pathD = `M ${points[0].x} ${CHART_HEIGHT - PADDING}`;
    pathD += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpX = (current.x + next.x) / 2;
      pathD += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    pathD += ` L ${points[points.length - 1].x} ${CHART_HEIGHT - PADDING}`;
    pathD += ' Z';

    return {
      pathD,
      wavePoints: points,
      hasData: true,
    };
  }, [data]);

  // アニメーションを開始
  const startAnimation = () => {
    animationProgress.setValue(0);
    setIsAnimating(true);

    Animated.timing(animationProgress, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: false, // SVGでは useNativeDriver: false が必要
    }).start(() => {
      setIsAnimating(false);
    });
  };

  // ループアニメーション（自動再生）
  useEffect(() => {
    if (hasData && showSurfer) {
      const loopAnimation = () => {
        animationProgress.setValue(0);
        Animated.timing(animationProgress, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }).start(() => {
          // 2秒待ってから再開
          setTimeout(loopAnimation, 2000);
        });
      };

      loopAnimation();
    }
  }, [hasData, showSurfer]);

  // 現在のサーファー位置を計算
  const getSurferPosition = (progress: number) => {
    if (wavePoints.length < 2) return { x: 0, y: 0 };

    const totalPoints = wavePoints.length - 1;
    const exactIndex = progress * totalPoints;
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.min(lowerIndex + 1, totalPoints);
    const t = exactIndex - lowerIndex;

    const p1 = wavePoints[lowerIndex];
    const p2 = wavePoints[upperIndex];

    // 線形補間
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    return { x, y };
  };

  // アニメーション値から位置を計算
  const [surferPos, setSurferPos] = useState({ x: PADDING, y: CHART_HEIGHT / 2 });

  useEffect(() => {
    const listener = animationProgress.addListener(({ value }) => {
      const pos = getSurferPosition(value);
      setSurferPos(pos);
    });

    return () => {
      animationProgress.removeListener(listener);
    };
  }, [wavePoints]);

  if (!hasData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>🏄 データがありません</Text>
          <Text style={styles.noDataSubtext}>気分を記録して波を作ろう！</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={startAnimation} activeOpacity={0.9}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#44A08D" stopOpacity={0.7} />
            </LinearGradient>
          </Defs>

          {/* 海の背景 */}
          <Path
            d={`M ${PADDING} ${CHART_HEIGHT - PADDING} L ${CHART_WIDTH - PADDING} ${CHART_HEIGHT - PADDING} L ${CHART_WIDTH - PADDING} ${CHART_HEIGHT - PADDING + 10} L ${PADDING} ${CHART_HEIGHT - PADDING + 10} Z`}
            fill="#2196F3"
            fillOpacity={0.3}
          />

          {/* 波 */}
          <Path
            d={pathD}
            fill="url(#waveGradient)"
            stroke="#2AB7B0"
            strokeWidth={2.5}
          />

          {/* 波の白い泡（装飾） */}
          <Path
            d={pathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            strokeDasharray="8,4"
          />

          {/* アニメーションするサーファー */}
          {showSurfer && (
            <G>
              {/* サーファーの影 */}
              <Circle
                cx={surferPos.x + 2}
                cy={surferPos.y - 8}
                r={14}
                fill="#000"
                fillOpacity={0.15}
              />
              {/* サーファーの背景円 */}
              <Circle
                cx={surferPos.x}
                cy={surferPos.y - 12}
                r={16}
                fill="#FFE66D"
              />
              {/* サーファー絵文字 */}
              <SvgText
                x={surferPos.x}
                y={surferPos.y - 5}
                fontSize={22}
                textAnchor="middle"
              >
                🏄
              </SvgText>
              {/* 波しぶき */}
              {isAnimating && (
                <>
                  <Circle
                    cx={surferPos.x - 20}
                    cy={surferPos.y + 5}
                    r={3}
                    fill="#FFFFFF"
                    fillOpacity={0.8}
                  />
                  <Circle
                    cx={surferPos.x - 15}
                    cy={surferPos.y + 10}
                    r={2}
                    fill="#FFFFFF"
                    fillOpacity={0.6}
                  />
                  <Circle
                    cx={surferPos.x - 25}
                    cy={surferPos.y + 8}
                    r={2.5}
                    fill="#FFFFFF"
                    fillOpacity={0.7}
                  />
                </>
              )}
            </G>
          )}

          {/* X軸のラベル */}
          {data.map((d, i) => {
            if (data.length <= 12 || i % Math.ceil(data.length / 12) === 0) {
              const x = PADDING + (i / (data.length - 1)) * (CHART_WIDTH - PADDING * 2);
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={CHART_HEIGHT - 5}
                  fontSize={10}
                  fill="#666"
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              );
            }
            return null;
          })}

          {/* 気分レベルのマーカー */}
          {wavePoints.map((point, i) => (
            point.value > 0 && (
              <Circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#FFF"
                stroke="#2AB7B0"
                strokeWidth={2}
              />
            )
          ))}
        </Svg>
      </TouchableOpacity>

      {/* 操作ヒント */}
      <Text style={styles.hint}>タップでアニメーション再生 🏄</Text>

      {/* 凡例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>😄</Text>
          <Text style={styles.legendText}>高い波</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>😢</Text>
          <Text style={styles.legendText}>低い波</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 24,
    color: '#999',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
