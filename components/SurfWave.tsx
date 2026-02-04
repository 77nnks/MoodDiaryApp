import React, { useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
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
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  useDerivedValue,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

// Animated SVG コンポーネントを作成
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

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

// 手書き風のランダムオフセット（worklet対応）
const getWobbleStatic = (seed: number, intensity: number = 2): number => {
  'worklet';
  return Math.sin(seed * 12.9898) * intensity - intensity / 2;
};

// 手書き風の円（静的）
const SketchyCircle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  seed?: number;
}> = ({ cx, cy, r, fill = 'none', stroke = '#333', strokeWidth = 2, seed = 0 }) => {
  const points: string[] = [];
  const segments = 12;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radiusWobble = r + getWobbleStatic(seed + i, 2);
    const px = cx + Math.cos(angle) * radiusWobble + getWobbleStatic(seed + i + 100, 2);
    const py = cy + Math.sin(angle) * radiusWobble + getWobbleStatic(seed + i + 200, 2);
    if (i === 0) {
      points.push(`M ${px} ${py}`);
    } else {
      points.push(`L ${px} ${py}`);
    }
  }

  return <Path d={points.join(' ') + ' Z'} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
};

// 手書き風の線
const SketchyLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
  seed?: number;
}> = ({ x1, y1, x2, y2, stroke = '#333', strokeWidth = 2, seed = 0 }) => {
  const midX = (x1 + x2) / 2 + getWobbleStatic(seed, 4);
  const midY = (y1 + y2) / 2 + getWobbleStatic(seed + 50, 4);

  const path = `M ${x1 + getWobbleStatic(seed + 1, 2)} ${y1 + getWobbleStatic(seed + 2, 2)}
                Q ${midX} ${midY} ${x2 + getWobbleStatic(seed + 3, 2)} ${y2 + getWobbleStatic(seed + 4, 2)}`;

  return <Path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />;
};

export const SurfWave: React.FC<SurfWaveProps> = ({
  data,
  title,
  showSurfer = true,
}) => {
  // Reanimated shared values（60fps ネイティブアニメーション）
  const animationProgress = useSharedValue(0);
  const boilingFrame = useSharedValue(0);
  const cloudOffset = useSharedValue(0);
  const seagullOffset = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  // 波しぶきの状態
  const [splashes, setSplashes] = React.useState<{id: number, x: number, y: number}[]>([]);
  const splashIdRef = React.useRef(0);

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

  // サーファー位置の補間計算（worklet）
  const surferState = useDerivedValue(() => {
    if (wavePoints.length < 2) return { x: PADDING, y: CHART_HEIGHT / 2, angle: 0, scale: 1 };

    const progress = animationProgress.value;
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

    // 手書き風の揺れ（60fpsでスムーズ）
    const wobbleX = Math.sin(progress * Math.PI * 12) * 2;
    const wobbleY = Math.cos(progress * Math.PI * 8) * 3;

    return { x: x + wobbleX, y: y + wobbleY - 5, angle: angle * 0.4, scale };
  }, [wavePoints]);

  // 波しぶきを追加するコールバック
  const addSplash = useCallback((x: number, y: number) => {
    splashIdRef.current += 1;
    setSplashes(prev => [...prev.slice(-5), { id: splashIdRef.current, x, y }]);
    // 1秒後に削除
    setTimeout(() => {
      setSplashes(prev => prev.slice(1));
    }, 1000);
  }, []);

  // アニメーション開始
  const startAnimation = useCallback(() => {
    animationProgress.value = 0;
    isAnimating.value = true;

    animationProgress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.quad),
    }, (finished) => {
      if (finished) {
        isAnimating.value = false;
      }
    });
  }, []);

  // メインループアニメーション
  useEffect(() => {
    if (!hasData) return;

    // サーファーアニメーションループ
    const loopSurfer = () => {
      animationProgress.value = 0;
      isAnimating.value = true;

      animationProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.quad),
      }, (finished) => {
        if (finished) {
          isAnimating.value = false;
          // ループを継続
          runOnJS(setTimeout)(() => {
            loopSurfer();
          }, 2500);
        }
      });
    };

    // ボイリングエフェクト（常時60fpsで動作）
    boilingFrame.value = withRepeat(
      withTiming(100, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // 雲の移動
    cloudOffset.value = withRepeat(
      withTiming(CHART_WIDTH + 100, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // カモメの移動
    seagullOffset.value = withRepeat(
      withTiming(CHART_WIDTH + 80, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );

    if (showSurfer) {
      setTimeout(loopSurfer, 500);
    }
  }, [hasData, showSurfer]);

  // 波しぶき生成（進行に合わせて）
  useEffect(() => {
    if (!hasData || !showSurfer) return;

    const interval = setInterval(() => {
      if (isAnimating.value && Math.random() > 0.7) {
        const state = surferState.value;
        addSplash(state.x - 10, state.y + 15);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [hasData, showSurfer, addSplash]);

  // 手書き風の波パスを生成
  const getHandDrawnWavePath = useCallback((frame: number) => {
    if (wavePoints.length < 2) return '';

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

  // 波パスのアニメーション
  const [currentBoilingFrame, setCurrentBoilingFrame] = React.useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBoilingFrame(f => (f + 1) % 100);
    }, 50); // 20fps for wave path updates
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

  const wavePath = getHandDrawnWavePath(currentBoilingFrame);
  const wavePathOverlay = getHandDrawnWavePath(currentBoilingFrame + 50);

  // サーファーの現在位置を取得
  const currentSurferState = surferState.value;

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
            <SketchyCircle cx={CHART_WIDTH - 55} cy={40} r={22} fill="#FFE566" stroke="#FFCC00" strokeWidth={2} seed={currentBoilingFrame} />
            {/* 太陽の光線（手書き風） */}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
              <SketchyLine
                key={i}
                x1={CHART_WIDTH - 55 + Math.cos((angle + currentBoilingFrame * 2) * Math.PI / 180) * 28}
                y1={40 + Math.sin((angle + currentBoilingFrame * 2) * Math.PI / 180) * 28}
                x2={CHART_WIDTH - 55 + Math.cos((angle + currentBoilingFrame * 2) * Math.PI / 180) * 38}
                y2={40 + Math.sin((angle + currentBoilingFrame * 2) * Math.PI / 180) * 38}
                stroke="#FFCC00"
                strokeWidth={2}
                seed={i + currentBoilingFrame}
              />
            ))}
          </G>

          {/* 手書き風の雲（スムーズに移動） */}
          <G transform={`translate(${(currentBoilingFrame * 2) % (CHART_WIDTH + 100) - 50}, 0)`}>
            <SketchyCircle cx={20} cy={30} r={12} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} seed={1} />
            <SketchyCircle cx={38} cy={25} r={16} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} seed={2} />
            <SketchyCircle cx={56} cy={30} r={12} fill="#FFFFFF" stroke="#DDD" strokeWidth={1} seed={3} />
          </G>

          {/* カモメ（手書き風） */}
          <G transform={`translate(${(currentBoilingFrame * 3) % (CHART_WIDTH + 80) - 40}, ${25 + Math.sin(currentBoilingFrame * 0.1) * 8})`}>
            <Path
              d={`M 0 0 Q 5 -5 10 0 Q 15 -5 20 0`}
              stroke="#444"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </G>
          <G transform={`translate(${((currentBoilingFrame * 3) + 100) % (CHART_WIDTH + 80) - 40}, ${40 + Math.sin(currentBoilingFrame * 0.12) * 6})`}>
            <Path
              d={`M 0 0 Q 4 -4 8 0 Q 12 -4 16 0`}
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
              const wobbleOffset = Math.sin(currentBoilingFrame * 0.1 + i) * 3;
              return (
                <G key={`foam-${i}`}>
                  <SketchyCircle
                    cx={point.x + wobbleOffset}
                    cy={point.y - 8 + Math.cos(currentBoilingFrame * 0.1 + i) * 2}
                    r={4}
                    fill="#FFFFFF"
                    stroke="#DDD"
                    strokeWidth={1}
                    seed={i * 10 + currentBoilingFrame}
                  />
                  <SketchyCircle
                    cx={point.x + 8 + wobbleOffset}
                    cy={point.y - 3}
                    r={3}
                    fill="#FFFFFF"
                    stroke="#EEE"
                    strokeWidth={1}
                    seed={i * 10 + 5 + currentBoilingFrame}
                  />
                </G>
              );
            }
            return null;
          })}

          {/* 水面のキラキラ（手書き風） */}
          {[...Array(5)].map((_, i) => {
            const sparkleX = PADDING + 30 + ((currentBoilingFrame * 2 + i * 60) % (CHART_WIDTH - PADDING * 2));
            const sparkleY = SKY_HEIGHT + PADDING + 20 + Math.sin(currentBoilingFrame * 0.1 + i) * 30;
            const opacity = (Math.sin(currentBoilingFrame * 0.15 + i * 2) + 1) / 2;
            return (
              <G key={`sparkle-${i}`} opacity={opacity}>
                <SketchyLine x1={sparkleX - 4} y1={sparkleY} x2={sparkleX + 4} y2={sparkleY} stroke="#FFF" strokeWidth={2} seed={i * 100} />
                <SketchyLine x1={sparkleX} y1={sparkleY - 4} x2={sparkleX} y2={sparkleY + 4} stroke="#FFF" strokeWidth={2} seed={i * 100 + 1} />
              </G>
            );
          })}

          {/* クロミ風キャラクター（黒ウサギ）サーファー */}
          {showSurfer && (
            <G
              transform={`translate(${currentSurferState.x}, ${currentSurferState.y}) rotate(${currentSurferState.angle}) scale(${currentSurferState.scale})`}
            >
              {/* 影 */}
              <Ellipse cx={0} cy={22} rx={22} ry={6} fill="#000" fillOpacity={0.15} />

              {/* サーフボード（ピンク×黒） */}
              <Path
                d={`M -28 12 Q -32 10 -28 8 L 28 8 Q 32 10 28 12 L -28 12`}
                fill="#FF69B4"
                stroke="#333"
                strokeWidth={2}
              />
              {/* サーフボードのドクロマーク風 */}
              <Circle cx={0} cy={10} r={3} fill="#333" />
              <SketchyLine x1={-20} y1={10} x2={-8} y2={10} stroke="#333" strokeWidth={2} seed={100} />
              <SketchyLine x1={8} y1={10} x2={20} y2={10} stroke="#333" strokeWidth={2} seed={101} />

              {/* ウサギの耳（黒フード風）- 左 */}
              <Path
                d={`M -12 -25
                   Q -14 -45 -8 -50
                   Q -2 -48 -4 -28`}
                fill="#2D2D2D"
                stroke="#1A1A1A"
                strokeWidth={2}
              />
              {/* 耳の内側（ピンク）- 左 */}
              <Path
                d={`M -10 -28
                   Q -11 -40 -7 -44
                   Q -4 -42 -5 -30`}
                fill="#FF69B4"
                stroke="none"
              />

              {/* ウサギの耳（黒フード風）- 右 */}
              <Path
                d={`M 12 -25
                   Q 14 -45 8 -50
                   Q 2 -48 4 -28`}
                fill="#2D2D2D"
                stroke="#1A1A1A"
                strokeWidth={2}
              />
              {/* 耳の内側（ピンク）- 右 */}
              <Path
                d={`M 10 -28
                   Q 11 -40 7 -44
                   Q 4 -42 5 -30`}
                fill="#FF69B4"
                stroke="none"
              />

              {/* 顔（白） */}
              <SketchyCircle cx={0} cy={-12} r={14} fill="#FFFFFF" stroke="#333" strokeWidth={2} seed={200} />

              {/* フード部分（黒・頭の上半分を覆う） */}
              <Path
                d={`M -14 -15
                   Q -15 -25 -10 -28
                   L -4 -28 L 4 -28 L 10 -28
                   Q 15 -25 14 -15
                   Q 10 -20 0 -22
                   Q -10 -20 -14 -15`}
                fill="#2D2D2D"
                stroke="#1A1A1A"
                strokeWidth={1}
              />

              {/* 目（大きくてキラキラ） */}
              {/* 左目 */}
              <Ellipse cx={-5} cy={-12} rx={4} ry={5} fill="#333" />
              <Circle cx={-6} cy={-14} r={1.5} fill="#FFF" />
              <Circle cx={-4} cy={-11} r={0.8} fill="#FFF" />
              {/* 右目 */}
              <Ellipse cx={5} cy={-12} rx={4} ry={5} fill="#333" />
              <Circle cx={4} cy={-14} r={1.5} fill="#FFF" />
              <Circle cx={6} cy={-11} r={0.8} fill="#FFF" />

              {/* 眉毛（いたずらっぽく） */}
              <Path
                d={`M -9 -18 Q -6 ${isAnimating.value ? -20 : -19} -2 -18`}
                stroke="#333"
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d={`M 9 -18 Q 6 ${isAnimating.value ? -20 : -19} 2 -18`}
                stroke="#333"
                strokeWidth={1.5}
                fill="none"
              />

              {/* 口（ニヤリ） */}
              <Path
                d={`M -4 -5 Q 0 ${isAnimating.value ? 0 : -2} 4 -5`}
                stroke="#333"
                strokeWidth={2}
                fill="none"
              />
              {/* いたずらっぽい牙 */}
              <Path
                d={`M -2 -5 L -1 -2`}
                stroke="#333"
                strokeWidth={1.5}
                fill="none"
              />

              {/* 頬（ピンク） */}
              <Ellipse cx={-10} cy={-8} rx={3} ry={2} fill="#FFB6C1" fillOpacity={0.7} />
              <Ellipse cx={10} cy={-8} rx={3} ry={2} fill="#FFB6C1" fillOpacity={0.7} />

              {/* 体（黒い服） */}
              <Path
                d={`M -8 2 L -10 8 L 10 8 L 8 2 Q 0 0 -8 2`}
                fill="#2D2D2D"
                stroke="#1A1A1A"
                strokeWidth={1}
              />
              {/* ドクロマーク風の装飾 */}
              <Circle cx={0} cy={5} r={2} fill="#FF69B4" />

              {/* 腕（黒い袖から白い手） */}
              <SketchyLine
                x1={-8}
                y1={3}
                x2={isAnimating.value ? -20 : -14}
                y2={isAnimating.value ? -5 : 5}
                stroke="#2D2D2D"
                strokeWidth={5}
                seed={300}
              />
              <SketchyCircle
                cx={isAnimating.value ? -22 : -16}
                cy={isAnimating.value ? -6 : 6}
                r={3}
                fill="#FFF"
                stroke="#333"
                strokeWidth={1}
                seed={301}
              />
              <SketchyLine
                x1={8}
                y1={3}
                x2={isAnimating.value ? 20 : 14}
                y2={isAnimating.value ? -5 : 5}
                stroke="#2D2D2D"
                strokeWidth={5}
                seed={302}
              />
              <SketchyCircle
                cx={isAnimating.value ? 22 : 16}
                cy={isAnimating.value ? -6 : 6}
                r={3}
                fill="#FFF"
                stroke="#333"
                strokeWidth={1}
                seed={303}
              />

              {/* しっぽ（ピンクのポンポン） */}
              <SketchyCircle cx={-5} cy={10} r={4} fill="#FF69B4" stroke="#FF1493" strokeWidth={1} seed={400} />
            </G>
          )}

          {/* X軸のラベル（手書き風フォント風） */}
          {data.map((d, i) => {
            if (data.length <= 12 || i % Math.ceil(data.length / 12) === 0) {
              const x = PADDING + (i / (data.length - 1)) * (CHART_WIDTH - PADDING * 2);
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={CHART_HEIGHT - 8}
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
                seed={i * 1000}
              />
            )
          ))}
        </Svg>

        {/* Lottie アニメーション（波しぶき） */}
        {splashes.map((splash) => (
          <View
            key={splash.id}
            style={{
              position: 'absolute',
              left: splash.x - 25,
              top: splash.y - 25,
              width: 50,
              height: 50,
            }}
          >
            <LottieView
              source={require('../assets/animations/splash.json')}
              autoPlay
              loop={false}
              style={{ width: 50, height: 50 }}
            />
          </View>
        ))}
      </TouchableOpacity>

      <Text style={styles.hint}>タップで再スタート 🖤🐰</Text>

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
