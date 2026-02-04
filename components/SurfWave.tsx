import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Ellipse,
  Rect,
} from 'react-native-svg';

interface SurfWaveProps {
  data: { label: string; value: number }[];
  title: string;
  showSurfer?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 280;
const PADDING = 30;
const SKY_HEIGHT = 60;
const ANIMATION_DURATION = 6000;

export const SurfWave: React.FC<SurfWaveProps> = ({
  data,
  title,
  showSurfer = true,
}) => {
  const animationProgress = useRef(new Animated.Value(0)).current;
  const waveOffset = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const seagullAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim = useRef(new Animated.Value(0)).current;

  const [isAnimating, setIsAnimating] = useState(false);
  const [surferPos, setSurferPos] = useState({ x: PADDING, y: CHART_HEIGHT / 2 });
  const [surferAngle, setSurferAngle] = useState(0);
  const [surferScale, setSurferScale] = useState(1);
  const [wavePhase, setWavePhase] = useState(0);
  const [sparkles, setSparkles] = useState<{x: number, y: number, opacity: number}[]>([]);
  const [splashes, setSplashes] = useState<{x: number, y: number, size: number, opacity: number}[]>([]);
  const [seagullX, setSeagullX] = useState(0);
  const [cloudX, setCloudX] = useState(0);

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
    const chartInnerHeight = CHART_HEIGHT - PADDING * 2 - SKY_HEIGHT - 20;

    const points = data.map((d, i) => {
      const x = PADDING + (i / (data.length - 1)) * chartInnerWidth;
      const normalizedValue = d.value > 0 ? (d.value - 1) / 4 : 0;
      const y = d.value > 0
        ? SKY_HEIGHT + PADDING + chartInnerHeight * (1 - normalizedValue)
        : CHART_HEIGHT - PADDING - 20;
      return { x, y, value: d.value, index: i };
    });

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

    return { pathD, wavePoints: points, hasData: true };
  }, [data]);

  // うねうね波を生成
  const getAnimatedWavePath = (phase: number) => {
    if (wavePoints.length < 2) return pathD;

    const chartInnerWidth = CHART_WIDTH - PADDING * 2;
    const chartInnerHeight = CHART_HEIGHT - PADDING * 2 - SKY_HEIGHT - 20;

    const animatedPoints = wavePoints.map((p, i) => {
      const waveY = Math.sin((i / wavePoints.length) * Math.PI * 4 + phase) * 3;
      return { ...p, y: p.y + waveY };
    });

    let newPath = `M ${animatedPoints[0].x} ${CHART_HEIGHT - PADDING}`;
    newPath += ` L ${animatedPoints[0].x} ${animatedPoints[0].y}`;

    for (let i = 0; i < animatedPoints.length - 1; i++) {
      const current = animatedPoints[i];
      const next = animatedPoints[i + 1];
      const cpX = (current.x + next.x) / 2;
      newPath += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    newPath += ` L ${animatedPoints[animatedPoints.length - 1].x} ${CHART_HEIGHT - PADDING}`;
    newPath += ' Z';

    return newPath;
  };

  // サーファー位置と角度を計算
  const getSurferState = (progress: number) => {
    if (wavePoints.length < 2) return { x: 0, y: 0, angle: 0, scale: 1 };

    const totalPoints = wavePoints.length - 1;
    const exactIndex = progress * totalPoints;
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.min(lowerIndex + 1, totalPoints);
    const t = exactIndex - lowerIndex;

    const p1 = wavePoints[lowerIndex];
    const p2 = wavePoints[upperIndex];

    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    // 傾きを計算
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // スケール（高い波=大きく、低い波=小さく）
    const avgValue = (p1.value + p2.value) / 2;
    const scale = 0.8 + (avgValue / 5) * 0.4;

    // 上下の揺れを追加
    const bounce = Math.sin(progress * Math.PI * 8) * 3;

    return { x, y: y + bounce, angle: angle * 0.5, scale };
  };

  // アニメーション開始
  const startAnimation = () => {
    animationProgress.setValue(0);
    setIsAnimating(true);

    Animated.timing(animationProgress, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      setIsAnimating(false);
    });
  };

  // メインループアニメーション
  useEffect(() => {
    if (!hasData) return;

    // サーファーアニメーション
    const loopSurfer = () => {
      animationProgress.setValue(0);
      setIsAnimating(true);
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        setIsAnimating(false);
        setTimeout(loopSurfer, 2000);
      });
    };

    // 波のうねりアニメーション
    const loopWave = () => {
      Animated.loop(
        Animated.timing(waveOffset, {
          toValue: Math.PI * 2,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    };

    // キラキラアニメーション
    const loopSparkle = () => {
      Animated.loop(
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    };

    // カモメアニメーション
    const loopSeagull = () => {
      Animated.loop(
        Animated.timing(seagullAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    };

    // 雲アニメーション
    const loopCloud = () => {
      Animated.loop(
        Animated.timing(cloudAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    };

    if (showSurfer) loopSurfer();
    loopWave();
    loopSparkle();
    loopSeagull();
    loopCloud();
  }, [hasData, showSurfer]);

  // アニメーション値のリスナー
  useEffect(() => {
    const surferListener = animationProgress.addListener(({ value }) => {
      const state = getSurferState(value);
      setSurferPos({ x: state.x, y: state.y });
      setSurferAngle(state.angle);
      setSurferScale(state.scale);

      // 波しぶきを生成
      if (isAnimating && Math.random() > 0.7) {
        setSplashes(prev => [
          ...prev.slice(-8),
          {
            x: state.x - 15 + Math.random() * 10,
            y: state.y + 5 + Math.random() * 10,
            size: 2 + Math.random() * 4,
            opacity: 0.8,
          }
        ]);
      }
    });

    const waveListener = waveOffset.addListener(({ value }) => {
      setWavePhase(value);
    });

    const sparkleListener = sparkleAnim.addListener(({ value }) => {
      // キラキラ位置をランダム生成
      if (Math.random() > 0.9) {
        setSparkles(prev => [
          ...prev.slice(-6),
          {
            x: PADDING + Math.random() * (CHART_WIDTH - PADDING * 2),
            y: SKY_HEIGHT + PADDING + Math.random() * 80,
            opacity: Math.random(),
          }
        ]);
      }
    });

    const seagullListener = seagullAnim.addListener(({ value }) => {
      setSeagullX(value * (CHART_WIDTH + 100) - 50);
    });

    const cloudListener = cloudAnim.addListener(({ value }) => {
      setCloudX(value * (CHART_WIDTH + 150) - 100);
    });

    return () => {
      animationProgress.removeListener(surferListener);
      waveOffset.removeListener(waveListener);
      sparkleAnim.removeListener(sparkleListener);
      seagullAnim.removeListener(seagullListener);
      cloudAnim.removeListener(cloudListener);
    };
  }, [wavePoints, isAnimating]);

  // 波しぶきのフェードアウト
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashes(prev =>
        prev
          .map(s => ({ ...s, opacity: s.opacity - 0.1, y: s.y - 1 }))
          .filter(s => s.opacity > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

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

  const animatedPath = getAnimatedWavePath(wavePhase);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={startAnimation} activeOpacity={0.9}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#87CEEB" stopOpacity={1} />
              <Stop offset="100%" stopColor="#E0F7FA" stopOpacity={1} />
            </LinearGradient>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.95} />
              <Stop offset="50%" stopColor="#26A69A" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#00796B" stopOpacity={0.85} />
            </LinearGradient>
            <RadialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFEB3B" stopOpacity={1} />
              <Stop offset="70%" stopColor="#FFC107" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#FF9800" stopOpacity={0.7} />
            </RadialGradient>
          </Defs>

          {/* 空の背景 */}
          <Rect x={0} y={0} width={CHART_WIDTH} height={SKY_HEIGHT + PADDING} fill="url(#skyGradient)" />

          {/* 太陽 */}
          <Circle cx={CHART_WIDTH - 50} cy={35} r={25} fill="url(#sunGradient)" />
          {/* 太陽の光線 */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <Path
              key={i}
              d={`M ${CHART_WIDTH - 50 + Math.cos(angle * Math.PI / 180) * 30} ${35 + Math.sin(angle * Math.PI / 180) * 30} L ${CHART_WIDTH - 50 + Math.cos(angle * Math.PI / 180) * 38} ${35 + Math.sin(angle * Math.PI / 180) * 38}`}
              stroke="#FFD54F"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* 雲 */}
          <G transform={`translate(${cloudX}, 0)`}>
            <Circle cx={30} cy={25} r={15} fill="#FFFFFF" fillOpacity={0.9} />
            <Circle cx={50} cy={20} r={20} fill="#FFFFFF" fillOpacity={0.9} />
            <Circle cx={70} cy={25} r={15} fill="#FFFFFF" fillOpacity={0.9} />
            <Circle cx={50} cy={30} r={12} fill="#FFFFFF" fillOpacity={0.9} />
          </G>
          <G transform={`translate(${cloudX - 150}, 0)`}>
            <Circle cx={30} cy={40} r={12} fill="#FFFFFF" fillOpacity={0.7} />
            <Circle cx={45} cy={35} r={15} fill="#FFFFFF" fillOpacity={0.7} />
            <Circle cx={60} cy={40} r={12} fill="#FFFFFF" fillOpacity={0.7} />
          </G>

          {/* カモメ */}
          <G transform={`translate(${seagullX}, ${20 + Math.sin(seagullX * 0.05) * 10})`}>
            <Path
              d="M 0 0 Q 5 -5 10 0 Q 15 -5 20 0"
              stroke="#333"
              strokeWidth={2}
              fill="none"
            />
          </G>
          <G transform={`translate(${seagullX - 60}, ${35 + Math.sin((seagullX - 60) * 0.05) * 8})`}>
            <Path
              d="M 0 0 Q 4 -4 8 0 Q 12 -4 16 0"
              stroke="#555"
              strokeWidth={1.5}
              fill="none"
            />
          </G>

          {/* 海の背景 */}
          <Rect
            x={0}
            y={SKY_HEIGHT + PADDING}
            width={CHART_WIDTH}
            height={CHART_HEIGHT - SKY_HEIGHT - PADDING}
            fill="#2196F3"
            fillOpacity={0.2}
          />

          {/* メインの波 */}
          <Path
            d={animatedPath}
            fill="url(#waveGradient)"
            stroke="#1DE9B6"
            strokeWidth={3}
          />

          {/* 波頭の泡 */}
          {wavePoints.map((point, i) => {
            if (point.value > 0) {
              const foamOffset = Math.sin(wavePhase + i) * 2;
              return (
                <G key={`foam-${i}`}>
                  <Circle
                    cx={point.x + foamOffset}
                    cy={point.y - 5 + foamOffset}
                    r={3}
                    fill="#FFFFFF"
                    fillOpacity={0.8}
                  />
                  <Circle
                    cx={point.x + 5 + foamOffset}
                    cy={point.y - 2}
                    r={2}
                    fill="#FFFFFF"
                    fillOpacity={0.6}
                  />
                </G>
              );
            }
            return null;
          })}

          {/* キラキラ水面 */}
          {sparkles.map((sparkle, i) => (
            <G key={`sparkle-${i}`}>
              <Circle
                cx={sparkle.x}
                cy={sparkle.y}
                r={2}
                fill="#FFFFFF"
                fillOpacity={sparkle.opacity}
              />
              <Path
                d={`M ${sparkle.x - 4} ${sparkle.y} L ${sparkle.x + 4} ${sparkle.y} M ${sparkle.x} ${sparkle.y - 4} L ${sparkle.x} ${sparkle.y + 4}`}
                stroke="#FFFFFF"
                strokeWidth={1}
                strokeOpacity={sparkle.opacity * 0.7}
              />
            </G>
          ))}

          {/* 波しぶき */}
          {splashes.map((splash, i) => (
            <Circle
              key={`splash-${i}`}
              cx={splash.x}
              cy={splash.y}
              r={splash.size}
              fill="#FFFFFF"
              fillOpacity={splash.opacity}
            />
          ))}

          {/* サーファー */}
          {showSurfer && (
            <G
              transform={`translate(${surferPos.x}, ${surferPos.y}) rotate(${surferAngle}) scale(${surferScale})`}
              origin={`${surferPos.x}, ${surferPos.y}`}
            >
              {/* サーファーの影 */}
              <Ellipse
                cx={0}
                cy={12}
                rx={18 * surferScale}
                ry={6}
                fill="#000"
                fillOpacity={0.15}
              />
              {/* サーフボード */}
              <Ellipse
                cx={0}
                cy={8}
                rx={22}
                ry={5}
                fill="#FFE082"
                stroke="#FFA000"
                strokeWidth={1}
              />
              {/* サーフボードのストライプ */}
              <Path
                d="M -15 8 L 15 8"
                stroke="#FF5722"
                strokeWidth={2}
              />
              {/* サーファーの体 */}
              <Circle cx={0} cy={-8} r={8} fill="#FFCCBC" />
              {/* 髪 */}
              <Path
                d="M -6 -14 Q 0 -20 6 -14"
                fill="#5D4037"
              />
              {/* サーファーの腕 */}
              <Path
                d={isAnimating ? "M -8 -2 L -18 -8 M 8 -2 L 18 -8" : "M -8 -2 L -15 2 M 8 -2 L 15 2"}
                stroke="#FFCCBC"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* サーファーの胴体 */}
              <Rect x={-6} y={-4} width={12} height={10} rx={3} fill="#2196F3" />
              {/* サーファーの足 */}
              <Path
                d="M -4 6 L -6 12 M 4 6 L 6 12"
                stroke="#FFCCBC"
                strokeWidth={3}
                strokeLinecap="round"
              />
              {/* 表情 */}
              <Circle cx={-3} cy={-9} r={1.5} fill="#333" />
              <Circle cx={3} cy={-9} r={1.5} fill="#333" />
              <Path
                d={isAnimating ? "M -3 -5 Q 0 -2 3 -5" : "M -3 -6 Q 0 -4 3 -6"}
                stroke="#333"
                strokeWidth={1}
                fill="none"
              />
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

          {/* データポイントマーカー */}
          {wavePoints.map((point, i) => (
            point.value > 0 && (
              <Circle
                key={`marker-${i}`}
                cx={point.x}
                cy={point.y}
                r={5}
                fill="#FFF"
                stroke="#00BCD4"
                strokeWidth={2}
              />
            )
          ))}
        </Svg>
      </TouchableOpacity>

      <Text style={styles.hint}>タップでサーファー再スタート 🏄‍♂️</Text>

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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
