import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
  Rect,
  Line,
} from 'react-native-svg';

interface SurfWaveProps {
  data: { label: string; value: number }[];
  title: string;
  showSurfer?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 300;
const PADDING = 30;
const SKY_HEIGHT = 70;
const ANIMATION_DURATION = 6000;

// 手書き風のランダムオフセットを生成
const getWobble = (intensity: number = 2) => {
  return (Math.random() - 0.5) * intensity;
};

// 手書き風のパスを生成（ボイリングエフェクト用）
const getSketchyPath = (points: {x: number, y: number}[], wobbleIntensity: number = 2): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x + getWobble(wobbleIntensity)} ${points[0].y + getWobble(wobbleIntensity)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // 手書き風にベジェ曲線で繋ぐ（ランダムな揺らぎを加える）
    const cpX1 = prev.x + (curr.x - prev.x) * 0.3 + getWobble(wobbleIntensity);
    const cpY1 = prev.y + getWobble(wobbleIntensity * 1.5);
    const cpX2 = prev.x + (curr.x - prev.x) * 0.7 + getWobble(wobbleIntensity);
    const cpY2 = curr.y + getWobble(wobbleIntensity * 1.5);
    const endX = curr.x + getWobble(wobbleIntensity);
    const endY = curr.y + getWobble(wobbleIntensity);

    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${endX} ${endY}`;
  }

  return path;
};

// 手書き風の円を生成
const SketchyCircle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  wobble?: number;
}> = ({ cx, cy, r, fill = 'none', stroke = '#333', strokeWidth = 2, wobble = 2 }) => {
  const points: {x: number, y: number}[] = [];
  const segments = 12;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radiusWobble = r + getWobble(wobble);
    points.push({
      x: cx + Math.cos(angle) * radiusWobble + getWobble(wobble),
      y: cy + Math.sin(angle) * radiusWobble + getWobble(wobble),
    });
  }

  const path = getSketchyPath(points, wobble);
  return <Path d={path + ' Z'} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
};

// 手書き風の線
const SketchyLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  wobble?: number;
}> = ({ x1, y1, x2, y2, stroke = '#333', strokeWidth = 2, wobble = 3 }) => {
  const midX = (x1 + x2) / 2 + getWobble(wobble * 2);
  const midY = (y1 + y2) / 2 + getWobble(wobble * 2);

  const path = `M ${x1 + getWobble(wobble)} ${y1 + getWobble(wobble)}
                Q ${midX} ${midY} ${x2 + getWobble(wobble)} ${y2 + getWobble(wobble)}`;

  return <Path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />;
};

export const SurfWave: React.FC<SurfWaveProps> = ({
  data,
  title,
  showSurfer = true,
}) => {
  const animationProgress = useRef(new Animated.Value(0)).current;
  const boilingAnim = useRef(new Animated.Value(0)).current;

  const [isAnimating, setIsAnimating] = useState(false);
  const [surferPos, setSurferPos] = useState({ x: PADDING, y: CHART_HEIGHT / 2 });
  const [surferAngle, setSurferAngle] = useState(0);
  const [surferScale, setSurferScale] = useState(1);
  const [boilingFrame, setBoilingFrame] = useState(0);
  const [splashes, setSplashes] = useState<{x: number, y: number, size: number, opacity: number, vx: number, vy: number}[]>([]);

  // 波のデータを計算
  const { wavePoints, hasData } = useMemo(() => {
    if (data.length === 0 || data.every((d) => d.value === 0)) {
      return { wavePoints: [], hasData: false };
    }

    const validData = data.filter((d) => d.value > 0);
    if (validData.length === 0) {
      return { wavePoints: [], hasData: false };
    }

    const chartInnerWidth = CHART_WIDTH - PADDING * 2;
    const chartInnerHeight = CHART_HEIGHT - PADDING * 2 - SKY_HEIGHT - 30;

    const points = data.map((d, i) => {
      const x = PADDING + (i / (data.length - 1)) * chartInnerWidth;
      const normalizedValue = d.value > 0 ? (d.value - 1) / 4 : 0;
      const y = d.value > 0
        ? SKY_HEIGHT + PADDING + chartInnerHeight * (1 - normalizedValue)
        : CHART_HEIGHT - PADDING - 30;
      return { x, y, value: d.value, index: i };
    });

    return { wavePoints: points, hasData: true };
  }, [data]);

  // 手書き風の波パスを生成（ボイリングエフェクト込み）
  const getHandDrawnWavePath = useCallback((frame: number) => {
    if (wavePoints.length < 2) return '';

    // シード値としてフレーム番号を使用して、一貫性のあるランダム性を生成
    const seed = frame * 0.1;
    const wobbleIntensity = 3;

    const animatedPoints = wavePoints.map((p, i) => ({
      x: p.x + Math.sin(seed + i * 0.5) * wobbleIntensity,
      y: p.y + Math.cos(seed + i * 0.7) * wobbleIntensity,
      value: p.value,
    }));

    let path = `M ${animatedPoints[0].x} ${CHART_HEIGHT - PADDING}`;
    path += ` L ${animatedPoints[0].x} ${animatedPoints[0].y}`;

    for (let i = 0; i < animatedPoints.length - 1; i++) {
      const curr = animatedPoints[i];
      const next = animatedPoints[i + 1];
      const cpX = (curr.x + next.x) / 2 + Math.sin(seed + i) * 2;
      const cpY1 = curr.y + Math.cos(seed + i * 0.8) * 3;
      const cpY2 = next.y + Math.sin(seed + i * 0.8) * 3;
      path += ` C ${cpX} ${cpY1}, ${cpX} ${cpY2}, ${next.x} ${next.y}`;
    }

    path += ` L ${animatedPoints[animatedPoints.length - 1].x} ${CHART_HEIGHT - PADDING}`;
    path += ' Z';

    return path;
  }, [wavePoints]);

  // サーファー位置と角度を計算
  const getSurferState = useCallback((progress: number) => {
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

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const avgValue = (p1.value + p2.value) / 2;
    const scale = 0.8 + (avgValue / 5) * 0.4;

    // 手書き風の揺れ
    const wobbleX = Math.sin(progress * Math.PI * 12) * 2;
    const wobbleY = Math.cos(progress * Math.PI * 8) * 3;

    return { x: x + wobbleX, y: y + wobbleY - 5, angle: angle * 0.4, scale };
  }, [wavePoints]);

  // アニメーション開始
  const startAnimation = () => {
    animationProgress.setValue(0);
    setIsAnimating(true);
    setSplashes([]);

    Animated.timing(animationProgress, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.quad),
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
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        setIsAnimating(false);
        setTimeout(loopSurfer, 2500);
      });
    };

    // ボイリングエフェクト（常に微妙に動く）
    const loopBoiling = () => {
      Animated.loop(
        Animated.timing(boilingAnim, {
          toValue: 100,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    };

    if (showSurfer) {
      setTimeout(loopSurfer, 500);
    }
    loopBoiling();
  }, [hasData, showSurfer]);

  // アニメーション値のリスナー
  useEffect(() => {
    const surferListener = animationProgress.addListener(({ value }) => {
      const state = getSurferState(value);
      setSurferPos({ x: state.x, y: state.y });
      setSurferAngle(state.angle);
      setSurferScale(state.scale);

      // 波しぶきを生成（物理演算付き）
      if (isAnimating && Math.random() > 0.6) {
        const angle = (Math.random() - 0.5) * Math.PI;
        const speed = 2 + Math.random() * 3;
        setSplashes(prev => [
          ...prev.slice(-12),
          {
            x: state.x - 10 + Math.random() * 5,
            y: state.y + 15,
            size: 2 + Math.random() * 4,
            opacity: 1,
            vx: Math.cos(angle) * speed - 2,
            vy: Math.sin(angle) * speed - 3,
          }
        ]);
      }
    });

    const boilingListener = boilingAnim.addListener(({ value }) => {
      setBoilingFrame(value);
    });

    return () => {
      animationProgress.removeListener(surferListener);
      boilingAnim.removeListener(boilingListener);
    };
  }, [wavePoints, isAnimating, getSurferState]);

  // 波しぶきの物理演算
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashes(prev =>
        prev
          .map(s => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            vy: s.vy + 0.3, // 重力
            opacity: s.opacity - 0.05,
          }))
          .filter(s => s.opacity > 0)
      );
    }, 40);
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

  const wavePath = getHandDrawnWavePath(boilingFrame);
  const wavePathOverlay = getHandDrawnWavePath(boilingFrame + 50);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={startAnimation} activeOpacity={0.9}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#87CEEB" stopOpacity={0.7} />
              <Stop offset="100%" stopColor="#E8F4F8" stopOpacity={0.9} />
            </LinearGradient>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#5DD3C8" stopOpacity={0.85} />
              <Stop offset="100%" stopColor="#3AA99E" stopOpacity={0.75} />
            </LinearGradient>
          </Defs>

          {/* 手書き風の空 */}
          <Rect x={0} y={0} width={CHART_WIDTH} height={SKY_HEIGHT + PADDING} fill="url(#skyGradient)" />

          {/* 手書き風の太陽 */}
          <G>
            <SketchyCircle cx={CHART_WIDTH - 55} cy={40} r={22} fill="#FFE566" stroke="#FFCC00" strokeWidth={2} wobble={3} />
            {/* 太陽の光線（手書き風） */}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
              <SketchyLine
                key={i}
                x1={CHART_WIDTH - 55 + Math.cos(angle * Math.PI / 180 + boilingFrame * 0.02) * 28}
                y1={40 + Math.sin(angle * Math.PI / 180 + boilingFrame * 0.02) * 28}
                x2={CHART_WIDTH - 55 + Math.cos(angle * Math.PI / 180 + boilingFrame * 0.02) * 38}
                y2={40 + Math.sin(angle * Math.PI / 180 + boilingFrame * 0.02) * 38}
                stroke="#FFCC00"
                strokeWidth={2}
                wobble={2}
              />
            ))}
          </G>

          {/* 手書き風の雲 */}
          <G transform={`translate(${(boilingFrame * 2) % (CHART_WIDTH + 100) - 50}, 0)`}>
            <SketchyCircle cx={20} cy={30} r={12} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} wobble={2} />
            <SketchyCircle cx={38} cy={25} r={16} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} wobble={2} />
            <SketchyCircle cx={56} cy={30} r={12} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} wobble={2} />
          </G>

          {/* カモメ（手書き風） */}
          <G transform={`translate(${(boilingFrame * 3) % (CHART_WIDTH + 80) - 40}, ${25 + Math.sin(boilingFrame * 0.1) * 8})`}>
            <Path
              d={`M 0 0 Q ${5 + getWobble(1)} ${-5 + getWobble(1)} 10 0 Q ${15 + getWobble(1)} ${-5 + getWobble(1)} 20 0`}
              stroke="#444"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </G>
          <G transform={`translate(${((boilingFrame * 3) + 100) % (CHART_WIDTH + 80) - 40}, ${40 + Math.sin(boilingFrame * 0.12) * 6})`}>
            <Path
              d={`M 0 0 Q ${4 + getWobble(1)} ${-4 + getWobble(1)} 8 0 Q ${12 + getWobble(1)} ${-4 + getWobble(1)} 16 0`}
              stroke="#666"
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          </G>

          {/* 海の背景 */}
          <Rect
            x={0}
            y={SKY_HEIGHT + PADDING - 10}
            width={CHART_WIDTH}
            height={CHART_HEIGHT - SKY_HEIGHT - PADDING + 10}
            fill="#B8E4E0"
            fillOpacity={0.3}
          />

          {/* メインの波（手書き風・二重線） */}
          <Path
            d={wavePath}
            fill="url(#waveGradient)"
            stroke="#2E8B84"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {/* 波のオーバーレイ（手書き感を強調） */}
          <Path
            d={wavePathOverlay}
            fill="none"
            stroke="#3CB8AD"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="8,4"
          />

          {/* 波頭の泡（手書き風） */}
          {wavePoints.map((point, i) => {
            if (point.value > 0) {
              const wobbleOffset = Math.sin(boilingFrame * 0.1 + i) * 3;
              return (
                <G key={`foam-${i}`}>
                  <SketchyCircle
                    cx={point.x + wobbleOffset}
                    cy={point.y - 8 + Math.cos(boilingFrame * 0.1 + i) * 2}
                    r={4}
                    fill="#FFFFFF"
                    stroke="#DDD"
                    strokeWidth={1}
                    wobble={2}
                  />
                  <SketchyCircle
                    cx={point.x + 8 + wobbleOffset}
                    cy={point.y - 3}
                    r={3}
                    fill="#FFFFFF"
                    stroke="#EEE"
                    strokeWidth={1}
                    wobble={1.5}
                  />
                </G>
              );
            }
            return null;
          })}

          {/* 波しぶき（手書き風・物理演算） */}
          {splashes.map((splash, i) => (
            <SketchyCircle
              key={`splash-${i}`}
              cx={splash.x}
              cy={splash.y}
              r={splash.size}
              fill="#FFFFFF"
              stroke="#DDD"
              strokeWidth={0.5}
              wobble={1}
            />
          ))}

          {/* 水面のキラキラ（手書き風） */}
          {[...Array(5)].map((_, i) => {
            const sparkleX = PADDING + 30 + ((boilingFrame * 2 + i * 60) % (CHART_WIDTH - PADDING * 2));
            const sparkleY = SKY_HEIGHT + PADDING + 20 + Math.sin(boilingFrame * 0.1 + i) * 30;
            const opacity = (Math.sin(boilingFrame * 0.15 + i * 2) + 1) / 2;
            return (
              <G key={`sparkle-${i}`} opacity={opacity}>
                <SketchyLine x1={sparkleX - 4} y1={sparkleY} x2={sparkleX + 4} y2={sparkleY} stroke="#FFF" strokeWidth={2} wobble={1} />
                <SketchyLine x1={sparkleX} y1={sparkleY - 4} x2={sparkleX} y2={sparkleY + 4} stroke="#FFF" strokeWidth={2} wobble={1} />
              </G>
            );
          })}

          {/* 手書き風サーファー */}
          {showSurfer && (
            <G
              transform={`translate(${surferPos.x}, ${surferPos.y}) rotate(${surferAngle}) scale(${surferScale})`}
            >
              {/* 影 */}
              <Ellipse cx={0} cy={20} rx={20} ry={6} fill="#000" fillOpacity={0.1} />

              {/* サーフボード（手書き風） */}
              <Path
                d={`M -25 10 Q -28 8 -25 6 L 25 6 Q 28 8 25 10 L -25 10`}
                fill="#FFE082"
                stroke="#E6A800"
                strokeWidth={2}
              />
              <SketchyLine x1={-18} y1={8} x2={18} y2={8} stroke="#FF7043" strokeWidth={2} wobble={1} />

              {/* 体（手書き風の棒人間スタイル） */}
              {/* 頭 */}
              <SketchyCircle cx={0} cy={-15} r={10} fill="#FFCCAA" stroke="#CC8866" strokeWidth={2} wobble={2} />

              {/* 髪の毛（手書き風） */}
              <Path
                d={`M -7 -22 Q ${-3 + getWobble(2)} ${-28 + getWobble(2)} 0 -25 Q ${3 + getWobble(2)} ${-28 + getWobble(2)} 7 -22`}
                fill="#553322"
                stroke="#442211"
                strokeWidth={1}
              />

              {/* 目（手書き風の点） */}
              <Circle cx={-4} cy={-16} r={2} fill="#333" />
              <Circle cx={4} cy={-16} r={2} fill="#333" />

              {/* 口（笑顔） */}
              <Path
                d={`M -4 -10 Q 0 ${isAnimating ? -6 : -8} 4 -10`}
                stroke="#333"
                strokeWidth={1.5}
                fill="none"
              />

              {/* 胴体（手書き風） */}
              <SketchyLine x1={0} y1={-5} x2={0} y2={5} stroke="#4488CC" strokeWidth={8} wobble={1} />

              {/* 腕（手書き風） */}
              <SketchyLine
                x1={-2}
                y1={-2}
                x2={isAnimating ? -18 : -12}
                y2={isAnimating ? -10 : 2}
                stroke="#FFCCAA"
                strokeWidth={4}
                wobble={2}
              />
              <SketchyLine
                x1={2}
                y1={-2}
                x2={isAnimating ? 18 : 12}
                y2={isAnimating ? -10 : 2}
                stroke="#FFCCAA"
                strokeWidth={4}
                wobble={2}
              />

              {/* 足（手書き風） */}
              <SketchyLine x1={-2} y1={5} x2={-6} y2={12} stroke="#FFCCAA" strokeWidth={4} wobble={1} />
              <SketchyLine x1={2} y1={5} x2={6} y2={12} stroke="#FFCCAA" strokeWidth={4} wobble={1} />
            </G>
          )}

          {/* X軸のラベル（手書き風フォント風） */}
          {data.map((d, i) => {
            if (data.length <= 12 || i % Math.ceil(data.length / 12) === 0) {
              const x = PADDING + (i / (data.length - 1)) * (CHART_WIDTH - PADDING * 2);
              return (
                <SvgText
                  key={i}
                  x={x + getWobble(1)}
                  y={CHART_HEIGHT - 8 + getWobble(1)}
                  fontSize={11}
                  fill="#555"
                  textAnchor="middle"
                  fontFamily="serif"
                >
                  {d.label}
                </SvgText>
              );
            }
            return null;
          })}

          {/* データポイントマーカー（手書き風） */}
          {wavePoints.map((point, i) => (
            point.value > 0 && (
              <SketchyCircle
                key={`marker-${i}`}
                cx={point.x}
                cy={point.y}
                r={6}
                fill="#FFF"
                stroke="#2E8B84"
                strokeWidth={2}
                wobble={2}
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
    backgroundColor: '#FFFEF8',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8E4D8',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'serif',
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
    color: '#888',
    marginTop: 10,
    fontStyle: 'italic',
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
    gap: 6,
  },
  legendEmoji: {
    fontSize: 18,
  },
  legendText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'serif',
  },
});
