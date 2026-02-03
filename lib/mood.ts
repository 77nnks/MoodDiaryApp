import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from './firebase';
import { MoodEntry, MoodLevel, getMoodOption } from '../types';

// 日付をYYYY-MM-DD形式に変換
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 今日の日付を取得
export const getToday = (): string => formatDate(new Date());

// 気分を保存
export const saveMood = async (level: MoodLevel): Promise<MoodEntry> => {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('ログインが必要です');
  }

  const today = getToday();
  const moodOption = getMoodOption(level);
  const now = new Date();

  const entry: MoodEntry = {
    id: today,
    date: today,
    level,
    emoji: moodOption.emoji,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, 'users', user.uid, 'moods', today);
  const existingDoc = await getDoc(docRef);

  if (existingDoc.exists()) {
    entry.createdAt = existingDoc.data().createdAt?.toDate() || now;
  }

  await setDoc(docRef, {
    ...entry,
    createdAt: Timestamp.fromDate(entry.createdAt),
    updatedAt: Timestamp.fromDate(entry.updatedAt),
  });

  return entry;
};

// 今日の気分を取得
export const getTodayMood = async (): Promise<MoodEntry | null> => {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) return null;

  const today = getToday();
  const docRef = doc(db, 'users', user.uid, 'moods', today);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      date: data.date,
      level: data.level,
      emoji: data.emoji,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  return null;
};

// 月の気分データを取得
export const getMonthMoods = async (
  year: number,
  month: number
): Promise<MoodEntry[]> => {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const moodsRef = collection(db, 'users', user.uid, 'moods');
  const q = query(
    moodsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const moods: MoodEntry[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    moods.push({
      id: doc.id,
      date: data.date,
      level: data.level,
      emoji: data.emoji,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return moods;
};

// 年の気分データを取得
export const getYearMoods = async (year: number): Promise<MoodEntry[]> => {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) return [];

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const moodsRef = collection(db, 'users', user.uid, 'moods');
  const q = query(
    moodsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const moods: MoodEntry[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    moods.push({
      id: doc.id,
      date: data.date,
      level: data.level,
      emoji: data.emoji,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return moods;
};

// 月ごとの平均気分を計算（年表示用）
export const getYearMonthlyAverages = async (
  year: number
): Promise<{ month: number; average: number }[]> => {
  const moods = await getYearMoods(year);
  const monthlyData: { [key: number]: number[] } = {};

  // 月ごとにグループ化
  moods.forEach((mood) => {
    const month = parseInt(mood.date.split('-')[1], 10);
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(mood.level);
  });

  // 平均を計算
  const averages: { month: number; average: number }[] = [];
  for (let month = 1; month <= 12; month++) {
    const levels = monthlyData[month] || [];
    const average =
      levels.length > 0
        ? levels.reduce((a, b) => a + b, 0) / levels.length
        : 0;
    averages.push({ month, average });
  }

  return averages;
};
