import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { MoodEntry } from '../types';

interface SurfWaveProps {
  data: { label: string; value: number }[];
  title: string;
  showSurfer?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;
const PADDING = 30;

export const SurfWave: React.FC<SurfWaveProps> = ({
  data,
  title,
  showSurfer = true,
}) => {
  const { pathD, surferPosition, hasData } = useMemo(() => {
    if (data.length === 0 || data.every((d) => d.value === 0)) {
      return { pathD: '', surferPosition: null, hasData: false };
    }

    const validData = data.filter((d) => d.value > 0);
    if (validData.length === 0) {
      return { pathD: '', surferPosition: null, hasData: false };
    }

    const chartInnerWidth = CHART_WIDTH - PADDING * 2;
    const chartInnerHeight = CHART_HEIGHT - PADDING * 2;

    // データポイントを計算
    const points = data.map((d, i) => {
      const x = PADDING + (i / (data.length - 1)) * chartInnerWidth;
      // 気分レベル(1-5)を波の高さに変換（逆転：高い気分=高い波）
      const normalizedValue = d.value > 0 ? (d.value - 1) / 4 : 0;
      const y =
        d.value > 0
          ? PADDING + chartInnerHeight * (1 - normalizedValue)
          : CHART_HEIGHT - PADDING;
      return { x, y, value: d.value };
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

    // サーファーの位置（最高値のポイント）
    const maxPoint = points.reduce(
      (max, p) => (p.value > max.value ? p : max),
      points[0]
    );

    return {
      pathD,
      surferPosition: maxPoint.value > 0 ? { x: maxPoint.x, y: maxPoint.y } : null,
      hasData: true,
    };
  }, [data]);

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
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* グラデーション背景の波 */}
        <Path d={pathD} fill="#4ECDC4" fillOpacity={0.6} stroke="#2AB7B0" strokeWidth={2} />

        {/* 波の泡（装飾） */}
        <Path
          d={pathD}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeDasharray="5,5"
        />

        {/* サーファーアイコン */}
        {showSurfer && surferPosition && (
          <G>
            <Circle
              cx={surferPosition.x}
              cy={surferPosition.y - 15}
              r={12}
              fill="#FFE66D"
            />
            <SvgText
              x={surferPosition.x}
              y={surferPosition.y - 10}
              fontSize={16}
              textAnchor="middle"
            >
              🏄
            </SvgText>
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
      </Svg>

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
    marginBottom: 16,
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
