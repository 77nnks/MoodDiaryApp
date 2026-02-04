/**
 * Duolingo風デザインシステム
 *
 * 特徴:
 * - 明るくカラフルな配色
 * - 丸みを帯びたUI
 * - 大きなタッチターゲット
 * - 影で浮いた感じのカード/ボタン
 * - ゲーミフィケーション要素
 */

export const colors = {
  // メインカラー（Duolingo風の明るい緑）
  primary: '#58CC02',
  primaryDark: '#46A302',
  primaryLight: '#89E219',

  // 気分レベル別カラー（グラデーション）
  mood: {
    level5: '#58CC02', // 最高 - 緑
    level4: '#84D8FF', // 良い - 水色
    level3: '#FFDE59', // 普通 - 黄色
    level2: '#FF9600', // 悪い - オレンジ
    level1: '#FF4B4B', // 最悪 - 赤
  },

  // 気分レベル別の暗い色（ボタンの底部）
  moodDark: {
    level5: '#46A302',
    level4: '#5CBADB',
    level3: '#E5C14D',
    level2: '#D17E00',
    level1: '#D13B3B',
  },

  // アクセントカラー
  accent: {
    yellow: '#FFC800',
    orange: '#FF9600',
    red: '#FF4B4B',
    blue: '#1CB0F6',
    purple: '#CE82FF',
    pink: '#FF69B4',
  },

  // ベースカラー
  background: '#235390', // Duolingoの青い背景
  backgroundLight: '#F7F7F7',
  card: '#FFFFFF',

  // テキスト
  text: {
    primary: '#3C3C3C',
    secondary: '#777777',
    light: '#AFAFAF',
    white: '#FFFFFF',
    dark: '#1A1A1A',
  },

  // ストリーク（炎）
  streak: {
    fire: '#FF9600',
    fireDark: '#E07800',
  },

  // ボーダー/シャドウ
  border: '#E5E5E5',
  shadow: 'rgba(0, 0, 0, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  huge: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Duolingo風のシャドウ（浮いた感じ）
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // ボタン用（底部に暗い影）
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 4,
  },
};

// 気分レベルからカラーを取得
export const getMoodColor = (level: number): string => {
  switch (level) {
    case 5: return colors.mood.level5;
    case 4: return colors.mood.level4;
    case 3: return colors.mood.level3;
    case 2: return colors.mood.level2;
    case 1: return colors.mood.level1;
    default: return colors.mood.level3;
  }
};

export const getMoodColorDark = (level: number): string => {
  switch (level) {
    case 5: return colors.moodDark.level5;
    case 4: return colors.moodDark.level4;
    case 3: return colors.moodDark.level3;
    case 2: return colors.moodDark.level2;
    case 1: return colors.moodDark.level1;
    default: return colors.moodDark.level3;
  }
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  getMoodColor,
  getMoodColorDark,
};
