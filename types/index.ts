export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  level: MoodLevel;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodOption {
  level: MoodLevel;
  emoji: string;
  label: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { level: 5, emoji: '😄', label: '最高' },
  { level: 4, emoji: '😊', label: '良い' },
  { level: 3, emoji: '😐', label: '普通' },
  { level: 2, emoji: '😔', label: '悪い' },
  { level: 1, emoji: '😢', label: '最悪' },
];

export const getMoodOption = (level: MoodLevel): MoodOption => {
  return MOOD_OPTIONS.find((m) => m.level === level) || MOOD_OPTIONS[2];
};
