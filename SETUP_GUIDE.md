# Discord Bot Builder - セットアップガイド

Discord Bot Builder は、ノーコードで Discord ボットを構築・管理できる Web アプリケーションです。このガイドでは、セットアップから運用までの手順を説明します。

---

## 目次

1. [前提条件](#前提条件)
2. [インストール](#インストール)
3. [環境変数設定](#環境変数設定)
4. [起動方法](#起動方法)
5. [使用方法](#使用方法)
6. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必須ソフトウェア

- **Node.js** 18.0 以上
- **npm** または **pnpm** 8.0 以上
- **MySQL** 8.0 以上（またはクラウド DB）
- **Git**（オプション）

### Discord 開発者アカウント

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリック
3. アプリケーション名を入力して作成
4. 「OAuth2」セクションで以下を確認：
   - **Client ID**
   - **Client Secret**

### Discord ボットトークン

1. Developer Portal で作成したアプリケーションを開く
2. 「Bot」セクションで「Add Bot」をクリック
3. 「TOKEN」をコピー（このトークンは秘密にしてください）

---

## インストール

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd discord-bot-builder
```

### 2. 依存関係のインストール

```bash
pnpm install
```

または npm を使用する場合：

```bash
npm install
```

### 3. データベースのセットアップ

#### オプション A: ローカル MySQL

最も簡単なのはセットアップスクリプトを使う方法です。`DATABASE_URL` に書いた
ユーザー名・パスワードのままデータベースとユーザーを作成し、権限を付与します。

```bash
# .env に DATABASE_URL を設定したうえで実行
pnpm run db:setup

# 既定の root 接続（mysql://root@localhost:3306、パスワードなし）が
# ローカルの MySQL 設定と一致しない場合は ADMIN_DATABASE_URL を指定します。
# root にパスワードがある場合もここで指定してください。
ADMIN_DATABASE_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306 pnpm run db:setup

# 管理者ユーザーが root 以外の場合はそのユーザー名に置き換えます
ADMIN_DATABASE_URL=mysql://admin:YOUR_ADMIN_PASSWORD@localhost:3306 pnpm run db:setup

# アプリが接続するクライアントホストを明示したい場合（既定は localhost・
# 127.0.0.1・::1）。% はどのホストからの接続も許可するため、リモート DB で
# 使う場合はファイアウォールやセキュリティグループで接続元を制限してください。
DB_ACCOUNT_HOST=% pnpm run db:setup
```

手動で作成する場合は次のとおりです。`DATABASE_URL` の値と一致させてください。

```bash
# MySQL サーバーに接続
mysql -u root -p

# データベースを作成
CREATE DATABASE discord_bot_builder;
CREATE USER 'bot_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON discord_bot_builder.* TO 'bot_user'@'localhost';
FLUSH PRIVILEGES;
```

> **メモ:** パスワードは `.env` の `DATABASE_URL` に書いた値と完全に一致させてください。
> 一致していないと `Access denied for user 'bot_user'@'localhost'` でログインに失敗します。

#### オプション B: クラウド DB（推奨）

- **Supabase**: https://supabase.com
- **PlanetScale**: https://planetscale.com
- **AWS RDS**: https://aws.amazon.com/rds/

---

## 環境変数設定

プロジェクトルートに `.env` ファイルを作成し、以下の変数を設定してください：

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:164968473b5d2bc0553fd2c0f719c4bdf1908a8e08f26c1cbba319c3a9b61ad2 -->

```env
# Database
DATABASE_URL=mysql://bot_user:secure_password@localhost:3306/discord_bot_builder

# Discord OAuth
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
VITE_DISCORD_CLIENT_ID=your_client_id_here


# JWT Secret
JWT_SECRET=your_jwt_secret_here_minimum_32_characters

# Generate once with: openssl rand -base64 32
TOKEN_ENCRYPTION_KEY=your_base64_encoded_32_byte_key

# Discord callback (required in production)
OAUTH_CALLBACK_URL=https://your-domain.example/api/discord/callback

# Manus 認証サービスのベース URL（利用する場合）
OAUTH_SERVER_URL=https://your-manus-auth-service.example

# Owner Info
OWNER_NAME=YourName
OWNER_OPEN_ID=your_open_id

# Analytics（オプション）
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Title & Logo
VITE_APP_TITLE=Discord Bot Builder
VITE_APP_LOGO=https://example.com/logo.png
```

<!-- /coderabbit-ai-generated:v1 -->

### 環境変数の説明

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:0975dce4e4e60060f58f9aaf41baa1e2663fd18e42db0fe5b0861b9dd21006ff -->

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `DATABASE_URL` | MySQL 接続文字列 | `mysql://user:pass@host/db` |
| `DISCORD_CLIENT_ID` | Discord アプリケーション ID | `1234567890` |
| `DISCORD_CLIENT_SECRET` | Discord クライアントシークレット | `abc123...` |
| `JWT_SECRET` | JWT 署名用シークレット | 32 文字以上のランダム文字列 |
| `TOKEN_ENCRYPTION_KEY` | トークン暗号化用の鍵 | `openssl rand -base64 32` で生成 |
| `OAUTH_SERVER_URL` | Manus 認証サービスのベース URL | 認証サービスの URL |
| `OAUTH_CALLBACK_URL` | 本番では必須。Discord に登録した HTTPS コールバック URL | `https://your-domain.example/api/discord/callback` |

<!-- /coderabbit-ai-generated:v1 -->
---

## 起動方法

### オプション 1: 統合起動スクリプト（推奨）

#### Linux/Mac

```bash
chmod +x start.sh
./start.sh
```

#### Windows

```bash
start.bat
```

### オプション 2: 手動起動

#### ターミナル 1: バックエンド

```bash
pnpm dev
```

#### ターミナル 2: フロントエンド（別ウィンドウ）

```bash
pnpm dev
```

### オプション 3: 本番環境での起動

```bash
pnpm build
pnpm start
```

---

## 使用方法

### 1. ログイン

1. ブラウザで `http://localhost:3000` にアクセス
2. 「Discord でログイン」をクリック
3. Discord アカウントで認証

### 2. ボットプロジェクト作成

1. ダッシュボードで「新規プロジェクト」をクリック
2. ボット名と Discord Bot Token を入力
3. 「作成」をクリック

### 3. Blockly エディタでボットを構築

1. プロジェクトをクリックして編集画面を開く
2. 左側のツールボックスからブロックをドラッグ
3. ブロックを組み合わせてロジックを構築

### 4. Python コードをエクスポート

1. エディタ画面で「エクスポート」をクリック
2. 生成された Python コードをダウンロード
3. ローカル環境で実行

```bash
# 生成されたコードを実行
python bot.py
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

**エラーメッセージ:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**原因:** MySQL サーバーが起動していない

**解決方法:**
```bash
# MySQL を起動
mysql.server start  # Mac
sudo systemctl start mysql  # Linux
# または Docker を使用
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0
```

#### 2. Discord OAuth エラー

**エラーメッセージ:**
```
Invalid OAuth2 redirect URI
```

**原因:** Discord Developer Portal の OAuth2 リダイレクト URI が正しく設定されていない

**解決方法:**
1. Discord Developer Portal を開く
2. OAuth2 → Redirects に以下を追加：
   - `http://localhost:3000/api/discord/callback`
   - `https://yourdomain.com/api/discord/callback`（本番環境）

#### 3. ポート競合エラー

**エラーメッセージ:**
```
Error: listen EADDRINUSE :::3000
```

**原因:** ポート 3000 が既に使用されている

**解決方法:**
```bash
# 別のポートで起動
PORT=3001 pnpm dev

# または既存プロセスを終了
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000  # Windows
```

#### 4. Python コード生成エラー

**エラーメッセージ:**
```
Block type not supported
```

**原因:** 使用しているブロックがコード生成に対応していない

**解決方法:**
- サポートされているブロックのみを使用
- 最新バージョンにアップデート

#### 5. メモリ不足エラー

**エラーメッセージ:**
```
JavaScript heap out of memory
```

**原因:** Node.js のメモリ制限に達した

**解決方法:**
```bash
# メモリ制限を増やして起動
NODE_OPTIONS=--max-old-space-size=4096 pnpm dev
```

### ログの確認

エラーが発生した場合、以下のログを確認してください：

- **フロントエンドエラー:** ブラウザの開発者ツール（F12）→ Console タブ
- **バックエンドエラー:** ターミナルの出力
- **データベースエラー:** `.manus-logs/devserver.log`

---

## 本番環境へのデプロイ

### 推奨ホスティングサービス

- **Vercel**: React フロントエンド
- **Render**: Node.js バックエンド
- **Heroku**: フルスタック
- **AWS**: スケーラブルなソリューション

### デプロイ手順（Vercel + Render の例）

#### 1. Vercel にフロントエンドをデプロイ

```bash
npm install -g vercel
vercel
```

#### 2. Render にバックエンドをデプロイ

1. Render.com にアクセス
2. 「Create New」→「Web Service」
3. GitHub リポジトリを接続
4. 環境変数を設定
5. デプロイ

---

## セキュリティ注意事項

⚠️ **重要:**

1. **トークンを公開しない**
   - `.env` ファイルを `.gitignore` に追加
   - GitHub に機密情報をコミットしない

2. **HTTPS を使用**
   - 本番環境では必ず HTTPS を使用

3. **定期的なバックアップ**
   - データベースを定期的にバックアップ

4. **依存関係の更新**
   - 定期的に `pnpm update` を実行

---

## サポート

問題が解決しない場合：

1. [GitHub Issues](https://github.com/your-repo/issues) で報告
2. [Discord コミュニティ](https://discord.gg/your-server) で質問
3. ドキュメントを確認

---

**最終更新:** 2026-06-16
