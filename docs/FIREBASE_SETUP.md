# Firebaseセットアップ手順

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `mood-diary-app`）
4. Google アナリティクスは任意（無料枠運用ならオフ推奨）
5. 「プロジェクトを作成」をクリック

## 2. Webアプリの追加

1. プロジェクト設定 > 「アプリを追加」> Web（`</>`アイコン）
2. アプリのニックネームを入力（例: `MoodDiaryApp`）
3. 「Firebase Hostingも設定する」はチェック不要
4. 「アプリを登録」をクリック
5. 表示された設定をコピー

## 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成:

```bash
cp .env.example .env
```

Firebase Consoleからコピーした値を設定:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=mood-diary-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=mood-diary-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=mood-diary-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 4. Firestoreの有効化

1. Firebase Console > 「構築」> 「Firestore Database」
2. 「データベースを作成」をクリック
3. **「本番環境モード」** を選択（セキュリティルールを設定するため）
4. ロケーションを選択（`asia-northeast1` = 東京 推奨）
5. 「有効にする」をクリック

## 5. セキュリティルールの設定

Firebase Console > Firestore > 「ルール」タブで以下を設定:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId}/moods/{date} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

「公開」をクリックして適用。

## 6. 匿名認証の有効化

1. Firebase Console > 「構築」> 「Authentication」
2. 「始める」をクリック
3. 「ログイン方法」タブ > 「匿名」を選択
4. 「有効にする」をオン
5. 「保存」をクリック

## 7. 動作確認

```bash
npm start
```

Expo Goアプリでスキャンし、気分を登録してみてください。
Firebase Console > Firestore で `users/{userId}/moods/` にデータが保存されていれば成功です。

---

## 無料枠の制限（Sparkプラン）

| サービス | 無料枠 |
|----------|--------|
| Firestore 保存容量 | 1 GiB |
| Firestore 読み取り | 50,000回/日 |
| Firestore 書き込み | 20,000回/日 |
| Firestore 削除 | 20,000回/日 |
| Authentication | 無制限 |

個人利用〜小規模なら十分無料枠内で運用可能です。

## トラブルシューティング

### 「Permission denied」エラー
- セキュリティルールが正しく設定されているか確認
- 匿名認証が有効になっているか確認

### データが保存されない
- `.env`ファイルの値が正しいか確認
- Firebase Consoleでプロジェクト設定の値と一致しているか確認
