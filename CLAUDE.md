# CLAUDE.md - 気分日記アプリ開発ガイド

このファイルはClaude Codeがこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

気分日記アプリ - その日の気分をワンタップで記録し、サーフィンの波のように視覚化するスマートフォンアプリ。

## 技術スタック

- **フレームワーク**: React Native + Expo (SDK 54)
- **言語**: TypeScript (strict mode)
- **ルーティング**: Expo Router v6
- **バックエンド**: Firebase (Firestore + Auth)
- **グラフィック**: react-native-svg

## ディレクトリ構成

```
app/           # 画面 (Expo Router)
  (tabs)/      # タブナビゲーション
components/    # 再利用可能なUIコンポーネント
lib/           # ビジネスロジック、Firebase連携
types/         # TypeScript型定義
i18n/          # 日本語テキスト
assets/        # 画像、アイコン
```

## コマンド

```bash
npm start          # 開発サーバー起動
npm run android    # Androidで実行
npm run ios        # iOSで実行
npm run web        # Webで実行
npx tsc --noEmit   # 型チェック
```

## コーディング規約

### TypeScript
- strict modeを使用
- 型は `types/index.ts` に集約
- any型は使用禁止

### コンポーネント
- 関数コンポーネント + React.FC を使用
- StyleSheet.create でスタイル定義
- コンポーネントごとに1ファイル

### 命名規則
- コンポーネント: PascalCase (`MoodSelector.tsx`)
- 関数・変数: camelCase (`saveMood`, `getMoodOption`)
- 定数: UPPER_SNAKE_CASE (`MOOD_OPTIONS`)
- 型: PascalCase (`MoodEntry`, `MoodLevel`)

### UI/UX
- 日本語UIが基本（`i18n/ja.ts`を使用）
- テーマカラー: `#4ECDC4`（ターコイズ）
- 気分レベル: 1-5（1=最悪😢, 5=最高😄）

## データ構造

### Firestore
```
users/{userId}/moods/{YYYY-MM-DD}
{
  date: string,      // "2026-02-03"
  level: 1-5,
  emoji: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### MoodLevel
```typescript
type MoodLevel = 1 | 2 | 3 | 4 | 5;
// 1: 😢 最悪
// 2: 😔 悪い
// 3: 😐 普通
// 4: 😊 良い
// 5: 😄 最高
```

## Firebase設定

環境変数（`.env`）で設定:
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 注意事項

- `.env`ファイルはコミットしない（`.gitignore`に含まれている）
- 匿名認証でゲストモードをサポート
- オフライン永続化はWeb環境のみ対応
- サーフィン可視化では気分レベルが波の高さに対応
