# Discord Bot Builder

Discord Bot をノーコードで構築・管理できる Web アプリケーション。Blockly を使ったビジュアルプログラミングで、複雑なボットロジックを簡単に実装できます。

![Discord Bot Builder](https://img.shields.io/badge/Discord-Bot-Builder-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)

---

## 🎯 特徴

- **ノーコード開発** - Blockly のドラッグ&ドロップでボットを構築
- **30+ のカスタムブロック** - イベント、アクション、条件分岐、スケジュール実行など
- **Python コード生成** - discord.py 準拠の実行可能なコードを自動生成
- **Discord OAuth 統合** - Discord アカウントで簡単ログイン
- **プロジェクト管理** - 複数のボットプロジェクトを一元管理
- **ダークテーマ UI** - Discord ライクな使いやすいインターフェース
- **複数サーバー対応** - 複数の Discord サーバーに同時にメッセージを送信
- **スケジュール実行** - 定期実行・毎日実行タスクをサポート

---

## 🚀 クイックスタート

### 前提条件

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:e878e13c62bf57f9e3167d9c8d05882189d92acbf1f17d28eaeafac43f860cef -->

- Node.js 18.0 以上
- npm または pnpm
- MySQL 8.0 以上
- Discord Developer Account
- Python 3（テスト時に必要。実行ファイルは `PYTHON` 環境変数で指定可能）

<!-- /coderabbit-ai-generated:v1 -->

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd discord-bot-builder

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp .env.example .env
# .env ファイルを編集して必要な値を設定
```

### データベースの準備

`DATABASE_URL` のユーザー名・パスワードでデータベースとユーザーを作成し、
テーブルを作成します。

```bash
# DATABASE_URL の内容でデータベース・ユーザー・権限を作成
pnpm run db:setup

# テーブルを作成（マイグレーション実行）
pnpm run db:push

# 接続確認（任意）
pnpm run db:check
```

> **メモ:** テーブルはサーバー初回起動時にも自動作成されます。`db:push` は
> 明示的に作成したい場合や、スキーマを先に整えたい場合に使ってください。

### 起動

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
start.bat
```

**ブラウザで開く:**
```
http://localhost:3000
```

---

## 📚 ドキュメント

- **[セットアップガイド](./SETUP_GUIDE.md)** - 詳細なインストール・設定手順
- **[トラブルシューティング](./TROUBLESHOOTING.md)** - よくある問題と解決方法
- **[ブロック一覧](./BLOCKS_REFERENCE.md)** - 利用可能なすべてのブロック
- **[API リファレンス](./API_REFERENCE.md)** - バックエンド API 仕様

---

## 🎮 使用方法

### 1. ログイン

Discord アカウントでログインします。

### 2. プロジェクト作成

ダッシュボードで「新規プロジェクト」をクリック。ボット名と Discord Bot Token を入力。

### 3. Blockly エディタでボットを構築

左側のツールボックスからブロックをドラッグして、ロジックを構築します。

### 4. Python コードをエクスポート

「エクスポート」ボタンで生成された Python コードをダウンロード。

### 5. ボットを実行

```bash
python bot.py
```

---

## 🏗️ アーキテクチャ

```
discord-bot-builder/
├── client/                    # React フロントエンド
│   ├── src/
│   │   ├── pages/            # ページコンポーネント
│   │   ├── components/       # UI コンポーネント
│   │   ├── lib/              # ユーティリティ関数
│   │   │   ├── blocklyBlocks.ts       # Blockly ブロック定義
│   │   │   └── pythonCodeGenerator.ts # Python コード生成
│   │   └── App.tsx           # メインアプリケーション
│   └── index.html
├── server/                    # Node.js バックエンド
│   ├── routers.ts            # tRPC ルーター
│   ├── db.ts                 # データベースクエリ
│   ├── discord-oauth.ts      # Discord OAuth ハンドラ
│   └── _core/                # コアシステム
├── drizzle/                   # データベーススキーマ
│   └── schema.ts             # テーブル定義
├── SETUP_GUIDE.md            # セットアップガイド
├── TROUBLESHOOTING.md        # トラブルシューティング
├── BLOCKS_REFERENCE.md       # ブロック一覧
├── API_REFERENCE.md          # API リファレンス
├── start.sh                  # Linux/Mac 起動スクリプト
└── start.bat                 # Windows 起動スクリプト
```

---

## 🛠️ 技術スタック

| 役割 | 技術 |
| --- | --- |
| **フロントエンド** | React 19, TypeScript, Vite, Tailwind CSS |
| **バックエンド** | Node.js, Express, tRPC |
| **ビジュアルエディタ** | Google Blockly |
| **データベース** | MySQL 8.0, Drizzle ORM |
| **認証** | Discord OAuth 2.0, JWT |
| **ボット実装** | discord.py |

---

## 📦 ブロック一覧

### イベントブロック
- ボット起動時
- メッセージ受信時
- メッセージ編集時
- メッセージ削除時
- メンバー参加時
- メンバー退出時
- リアクション追加時
- リアクション削除時

### アクションブロック
- メッセージ送信
- メッセージ編集
- メッセージ削除
- リアクション追加
- ロール付与
- ロール削除
- メンバーをキック
- メンバーをバン

### 高度なブロック
- 条件付きメッセージ送信
- 全サーバー取得
- サーバー名で検索
- 全サーバーにメッセージ送信
- スケジュール実行（間隔）
- スケジュール実行（毎日）
- 待機

---

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:5acfb77f1d7160897b7a27e4679025c332e110b94831c134068c302484d6afff -->

## 既存トークンの暗号化

新規・既存の環境で `TOKEN_ENCRYPTION_KEY` に `openssl rand -base64 32` で生成した鍵を設定してください。JWT 鍵とは別に保管し、再起動後も同じ鍵を使います。鍵を紛失すると保存したトークンを復号できません。

既存データベースを更新する場合は、アプリを停止して書き込みを止め、データベースをバックアップしたうえで `pnpm tokens:migrate` を実行してください。Bot トークンと Discord OAuth キャッシュのトークンを一括で暗号化します。成功後にアプリを起動してください。移行は再実行できます。バックアップには移行前の平文が残るため、安全に保管してください。

プロジェクト取得 API とエクスポートした Python ファイルには Bot トークンが含まれます。HTTPS を使用し、出力ファイルを秘密として扱ってください。

## 🔐 セキュリティ

<!-- /coderabbit-ai-generated:v1 -->

- Discord OAuth 2.0 による安全な認証
- JWT トークンによるセッション管理
- 環境変数による機密情報管理
- HTTPS 推奨（本番環境）
- トークン暗号化保存

---

## 📊 パフォーマンス

- **フロントエンド:** Vite による高速ビルド
- **バックエンド:** Express による軽量サーバー
- **データベース:** MySQL インデックス最適化
- **キャッシング:** ブラウザキャッシュ活用

---

## 🐛 トラブルシューティング

問題が発生した場合は、以下を確認してください：

1. **[トラブルシューティングガイド](./TROUBLESHOOTING.md)** を確認
2. ブラウザの開発者ツール (F12) でエラーを確認
3. `.manus-logs/devserver.log` でサーバーログを確認

---

## 🤝 貢献

バグ報告や機能リクエストは GitHub Issues で受け付けています。

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照

---

## 📞 サポート

- **ドキュメント:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **API:** [API_REFERENCE.md](./API_REFERENCE.md)
- **ブロック:** [BLOCKS_REFERENCE.md](./BLOCKS_REFERENCE.md)
- **トラブル:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎓 学習リソース

- [Discord.py ドキュメント](https://discordpy.readthedocs.io/)
- [Blockly ドキュメント](https://developers.google.com/blockly)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

**最終更新:** 2026-06-16

**バージョン:** 1.0.0

---

## 🎉 今すぐ始める！

1. リポジトリをクローン
2. `./start.sh` または `start.bat` を実行
3. ブラウザで `http://localhost:3000` を開く
4. Discord でログイン
5. ボットを構築！

Happy Bot Building! 🤖
