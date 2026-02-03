# 気分日記 🏄 MoodDiaryApp

その日の気分をワンタップで記録し、サーフィンの波のように視覚化するスマートフォンアプリです。

## 機能

### 🏠 ホーム - 気分登録
- 5段階の気分をワンタップで選択
  - 😄 最高
  - 😊 良い
  - 😐 普通
  - 😔 悪い
  - 😢 最悪
- 今日の気分を簡単に記録

### 📅 カレンダー
- 月ごとの気分を一覧表示
- 過去の記録を振り返り
- 月間統計（記録日数、平均気分）

### 🏄 サーフ - 可視化
- 気分の推移を波として可視化
- 月表示：1日〜末日の波
- 年表示：1月〜12月の波
- 気分が良い日 = 大きな波 🌊
- サーファーが最高の波に乗る！

## 技術スタック

- **フレームワーク**: React Native + Expo
- **言語**: TypeScript
- **バックエンド**: Firebase (Firestore + Auth)
- **ルーティング**: Expo Router

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Firestoreを有効化
3. Authenticationで匿名認証を有効化
4. `.env`ファイルを作成し、Firebase設定を追加:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 開発サーバーの起動

```bash
npm start
```

### 4. アプリの実行

- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## ディレクトリ構成

```
MoodDiaryApp/
├── app/                    # 画面 (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx       # ホーム（気分登録）
│   │   ├── calendar.tsx    # カレンダー
│   │   └── surf.tsx        # サーフィン可視化
│   └── _layout.tsx         # ルートレイアウト
├── components/             # UIコンポーネント
│   ├── MoodSelector.tsx    # 気分選択
│   └── SurfWave.tsx        # 波グラフ
├── lib/                    # ロジック
│   ├── firebase.ts         # Firebase設定
│   └── mood.ts             # 気分データ操作
├── types/                  # 型定義
│   └── index.ts
├── i18n/                   # 日本語テキスト
│   └── ja.ts
└── assets/                 # 画像等
```

## Firestore構造

```
users/{userId}/moods/{date}
{
  date: "2026-02-03",
  level: 5,           // 1-5
  emoji: "😄",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## ライセンス

MIT
