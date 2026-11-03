# Discord Bot Builder - トラブルシューティングガイド

このドキュメントでは、よくある問題と解決方法を紹介します。

---

## 目次

1. [インストール・セットアップ関連](#インストール・セットアップ関連)
2. [起動・実行関連](#起動・実行関連)
3. [Discord OAuth 関連](#discord-oauth-関連)
4. [データベース関連](#データベース関連)
5. [Blockly エディタ関連](#blockly-エディタ関連)
6. [Python コード生成関連](#python-コード生成関連)
7. [ボット実行関連](#ボット実行関連)

---

## インストール・セットアップ関連

### Q1: `pnpm install` でエラーが出る

**エラーメッセージ例:**
```
error: Command failed with exit code 1
```

**原因:**
- Node.js のバージョンが古い
- npm キャッシュが破損している

**解決方法:**
```bash
# Node.js バージョン確認
node --version  # 18.0 以上が必要

# npm キャッシュをクリア
pnpm store prune

# 再度インストール
pnpm install
```

### Q2: `pnpm` コマンドが見つからない

**エラーメッセージ:**
```
pnpm: command not found
```

**原因:** pnpm がインストールされていない

**解決方法:**
```bash
# pnpm をインストール
npm install -g pnpm

# バージョン確認
pnpm --version
```

### Q3: `.env` ファイルが見つからない

**原因:** 環境変数ファイルが作成されていない

**解決方法:**
```bash
# プロジェクトルートで .env ファイルを作成
cp .env.example .env

# エディタで編集
nano .env
```

---

## 起動・実行関連

### Q4: `pnpm dev` で起動しない

**エラーメッセージ:**
```
Error: Cannot find module 'vite'
```

**原因:** 依存関係がインストールされていない

**解決方法:**
```bash
# 依存関係を再インストール
pnpm install

# キャッシュをクリア
pnpm store prune

# 再度起動
pnpm dev
```

### Q5: ポート 3000 が既に使用されている

**エラーメッセージ:**
```
Error: listen EADDRINUSE :::3000
```

**原因:** 別のプロセスがポート 3000 を使用している

**解決方法:**

**Mac/Linux:**
```bash
# ポート 3000 を使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
PORT=3001 pnpm dev
```

**Windows:**
```bash
# ポート 3000 を使用しているプロセスを確認
netstat -ano | findstr :3000

# プロセスを終了
taskkill /PID <PID> /F

# または別のポートで起動
set PORT=3001 && pnpm dev
```

### Q6: メモリ不足エラー

**エラーメッセージ:**
```
JavaScript heap out of memory
```

**原因:** Node.js のメモリ制限に達した

**解決方法:**
```bash
# メモリ制限を増やして起動
NODE_OPTIONS=--max-old-space-size=4096 pnpm dev

# または .env に設定
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env
```

---

## Discord OAuth 関連

### Q7: OAuth ログインが失敗する

**エラーメッセージ:**
```
Invalid OAuth2 redirect URI
```

**原因:** Discord Developer Portal のリダイレクト URI が正しく設定されていない

**解決方法:**
1. [Discord Developer Portal](https://discord.com/developers/applications) を開く
2. アプリケーションを選択
3. OAuth2 → Redirects に以下を追加：
   ```
   http://localhost:3000/api/discord/callback
   ```
4. 「Save Changes」をクリック

### Q8: Client ID/Secret が無効

**エラーメッセージ:**
```
Invalid client_id or client_secret
```

**原因:** 環境変数が正しく設定されていない

**解決方法:**
```bash
# .env ファイルを確認
cat .env

# 正しい値が設定されているか確認
# DISCORD_CLIENT_ID と DISCORD_CLIENT_SECRET を確認

# 値が間違っていれば修正
nano .env

# アプリケーションを再起動
pnpm dev
```

### Q9: ログイン後にダッシュボードが表示されない

**原因:** セッション情報が正しく保存されていない

**解決方法:**
1. ブラウザのキャッシュをクリア
2. Cookie を削除
3. 再度ログイン

```bash
# ブラウザの開発者ツール (F12) → Application → Cookies → 削除
```

---

## データベース関連

### Q10: データベース接続エラー

**エラーメッセージ:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**原因:** MySQL サーバーが起動していない

**解決方法:**

**Mac:**
```bash
# MySQL を起動
mysql.server start

# ステータス確認
mysql.server status
```

**Linux:**
```bash
# MySQL を起動
sudo systemctl start mysql

# ステータス確認
sudo systemctl status mysql
```

**Windows:**
```bash
# MySQL を起動
net start MySQL80
```

**Docker を使用:**
```bash
# MySQL コンテナを起動（DATABASE_URL のユーザー/パスワードと合わせること）
docker run -d -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=discord_bot_builder \
  -e MYSQL_USER=bot_user \
  -e MYSQL_PASSWORD=secure_password \
  mysql:8.0
```

コンテナの `MYSQL_USER` / `MYSQL_PASSWORD` は `.env` の `DATABASE_URL` と一致させてください。
既存の MySQL を使う場合も、`pnpm run db:setup` でユーザーと権限をまとめて作成できます。

### Q11: データベース認証エラー

**エラーメッセージ:**
```
Error: Access denied for user 'bot_user'@'localhost'
```
または起動ログ / ログイン時の 500 応答:
```
[Database] Could not connect to MySQL at mysql://bot_user:***@localhost:3306/discord_bot_builder
```

**原因:** `.env` の `DATABASE_URL` に書いたユーザー名またはパスワードが MySQL 側と一致していない、
もしくはユーザー・権限が作成されていない

**解決方法:**

最も簡単なのは、`DATABASE_URL` の値のままユーザーと権限を作成するスクリプトです。

```bash
# DATABASE_URL のユーザー名・パスワードでデータベースとユーザーを作成
pnpm run db:setup
```

手動で直す場合は次のとおりです。

```bash
# MySQL にログイン
mysql -u root -p

# ユーザーを確認
SELECT User, Host FROM mysql.user;

# ユーザーを作成（存在する場合はパスワードを DATABASE_URL と一致させる）
# パスワードは .env の DATABASE_URL と完全に一致させること
CREATE USER IF NOT EXISTS 'bot_user'@'localhost' IDENTIFIED BY 'secure_password';
ALTER USER 'bot_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON discord_bot_builder.* TO 'bot_user'@'localhost';
FLUSH PRIVILEGES;
```

`.env` の `DATABASE_URL` も同じ値になっていることを確認してください。
`pnpm run db:check` で接続だけを確認できます。

### Q12: マイグレーションエラー

**エラーメッセージ:**
```
Error: Migration failed
```

**原因:** データベーススキーマが正しく初期化されていない

**解決方法:**
```bash
# マイグレーションを実行
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# または手動で SQL を実行
mysql -u bot_user -p discord_bot_builder < drizzle/migrations/0001.sql
```

---

## Blockly エディタ関連

### Q13: ブロックが表示されない

**原因:** Blockly ライブラリが正しく読み込まれていない

**解決方法:**
1. ブラウザの開発者ツール (F12) → Console を確認
2. エラーメッセージを確認
3. ページをリロード

```bash
# キャッシュをクリアしてリロード
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Q14: ブロックがドラッグできない

**原因:** JavaScript が無効になっている

**解決方法:**
1. ブラウザの設定で JavaScript を有効にする
2. ブラウザを再起動

### Q15: ワークスペースが保存されない

**原因:** ブラウザの Local Storage が無効

**解決方法:**
1. ブラウザの設定で Local Storage を有効にする
2. ブラウザのプライベートモードを無効にする

---

## Python コード生成関連

### Q16: エクスポートボタンが動作しない

**原因:** ブロックが正しく定義されていない

**解決方法:**
1. ブロックが完全に接続されているか確認
2. 必須フィールドが入力されているか確認
3. ブラウザの開発者ツールでエラーを確認

### Q17: 生成されたコードが不完全

**原因:** 一部のブロックがコード生成に対応していない

**解決方法:**
- サポートされているブロックのみを使用
- 最新バージョンにアップデート

```bash
pnpm update
```

### Q18: Python コードの構文エラー

**エラーメッセージ:**
```
SyntaxError: invalid syntax
```

**原因:** 生成されたコードに構文エラーがある

**解決方法:**
1. 生成されたコードを確認
2. 手動で修正
3. または Blockly で再度構築

---

## ボット実行関連

### Q19: ボットが起動しない

**エラーメッセージ:**
```
discord.errors.LoginFailure: Improper token has been passed.
```

**原因:** Discord Bot Token が無効

**解決方法:**
1. Discord Developer Portal で新しいトークンを生成
2. 生成されたコードのトークンを更新

```python
# bot.py の最後の行を修正
bot.run('YOUR_NEW_TOKEN_HERE')
```

### Q20: ボットがコマンドに応答しない

**原因:** イベントハンドラが正しく定義されていない

**解決方法:**
1. Blockly で `on_message` イベントが定義されているか確認
2. メッセージ内容をチェックするロジックが正しいか確認
3. ボットのパーミッションを確認

### Q21: ボットがメッセージを送信できない

**エラーメッセージ:**
```
discord.errors.Forbidden: 403 Forbidden
```

**原因:** ボットにメッセージ送信のパーミッションがない

**解決方法:**
1. Discord サーバーの設定を開く
2. ボットロールを選択
3. 以下のパーミッションを有効にする：
   - Send Messages
   - Send Messages in Threads
   - Embed Links
   - Attach Files

---

## デバッグのコツ

### ログを確認

```bash
# バックエンドログ
tail -f .manus-logs/devserver.log

# ブラウザコンソール
# F12 → Console タブ
```

### ブレークポイントを設定

```bash
# VS Code でデバッグ
# F5 キーを押してデバッガを起動
```

### 環境変数を確認

```bash
# 環境変数が正しく読み込まれているか確認
echo $DATABASE_URL
echo $DISCORD_CLIENT_ID
```

---

## さらにサポートが必要な場合

1. **GitHub Issues**: https://github.com/your-repo/issues
2. **Discord コミュニティ**: https://discord.gg/your-server
3. **ドキュメント**: SETUP_GUIDE.md を確認

---

**最終更新:** 2026-06-16
