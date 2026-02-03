# ビルド＆デプロイ手順

## 前提条件

- Node.js 18以上
- Expoアカウント（無料）
- EAS CLIインストール済み

```bash
npm install -g eas-cli
eas login
```

## 開発ビルド

### Android APK（開発用）

```bash
eas build --platform android --profile development
```

### iOS シミュレータ用

```bash
eas build --platform ios --profile development
```

## プレビュービルド（内部テスト用）

社内テストやベータテスト用のビルド。

### Android APK

```bash
eas build --platform android --profile preview
```

ビルド完了後、QRコードまたはURLからAPKをダウンロード可能。

### iOS（Ad Hoc）

```bash
eas build --platform ios --profile preview
```

※ Apple Developer Program（年額$99）が必要

## 本番ビルド

### Android（Google Play用 AAB）

```bash
eas build --platform android --profile production
```

### iOS（App Store用）

```bash
eas build --platform ios --profile production
```

## ストア提出

### Google Play

1. [Google Play Console](https://play.google.com/console) でアプリを作成
2. サービスアカウントキーを取得し `google-services.json` として保存
3. 以下のコマンドで提出:

```bash
eas submit --platform android --profile production
```

### App Store

1. [App Store Connect](https://appstoreconnect.apple.com/) でアプリを作成
2. `eas.json` の `appleId` と `ascAppId` を設定
3. 以下のコマンドで提出:

```bash
eas submit --platform ios --profile production
```

## OTA（Over The Air）アップデート

JavaScript/アセットのみの変更は、ストアを経由せずにアップデート可能。

```bash
eas update --branch production --message "バグ修正"
```

## 環境変数の管理

### ローカル開発
`.env` ファイルを使用（gitignore済み）

### EAS Build
EAS Secretsを使用:

```bash
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-auth-domain"
# ... 他の環境変数も同様に設定
```

## 費用

### 無料でできること
- Expoアカウント: 無料
- EAS Build: 月30ビルドまで無料
- Firebase Spark: 無料枠内

### 有料が必要なもの
- Apple Developer Program: $99/年（iOS配布に必須）
- Google Play Console: $25（一回のみ、Android配布に必須）

## よくある質問

### Q: Expo Goで十分では？
A: 開発中はExpo Goで十分です。ストアに公開する際にEAS Buildが必要になります。

### Q: ビルドにどれくらい時間がかかる？
A: 初回は15-30分程度。キャッシュが効けば5-10分程度。

### Q: APKを直接配布できる？
A: はい。`preview`プロファイルでビルドしたAPKは直接配布可能です（Androidのみ）。
