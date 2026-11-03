#!/bin/bash

#######################################
# Discord Bot Builder - 統合起動スクリプト
# フロントエンド＋バックエンド両方を起動
#######################################

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   Discord Bot Builder - Launcher      ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# 環境変数ファイルの確認
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ エラー: .env ファイルが見つかりません${NC}"
    echo -e "${YELLOW}セットアップガイドを確認してください: SETUP_GUIDE.md${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .env ファイルを確認しました${NC}"

# Node.js のバージョン確認
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ エラー: Node.js 18.0 以上が必要です${NC}"
    echo -e "${YELLOW}現在のバージョン: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js バージョン: $(node -v)${NC}"

# pnpm のインストール確認
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠ pnpm がインストールされていません。インストール中...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✓ pnpm バージョン: $(pnpm -v)${NC}"

# 依存関係のインストール
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ 依存関係をインストール中...${NC}"
    pnpm install
    echo -e "${GREEN}✓ 依存関係をインストールしました${NC}"
fi

# ポート確認
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}✗ エラー: ポート $PORT は既に使用されています${NC}"
    echo -e "${YELLOW}別のポートで起動するには: PORT=3001 ./start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✓ ポート $PORT は利用可能です${NC}"

# MySQL 接続確認
echo -e "${YELLOW}⚠ データベース接続を確認中...${NC}"
if ! DB_CHECK_OUTPUT=$(timeout 10 pnpm exec tsx scripts/check-db.ts 2>&1); then
    echo -e "${RED}✗ データベースに接続できません${NC}"
    echo "$DB_CHECK_OUTPUT"
    echo -e "${YELLOW}DATABASE_URL のユーザー名・パスワードと、MySQL ユーザーの権限を確認してください${NC}"
    echo -e "${YELLOW}ユーザーが未作成の場合は次を実行してください: pnpm run db:setup${NC}"
    echo ""
else
    echo -e "${GREEN}✓ データベース接続を確認しました${NC}"
fi

# 起動
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}起動中...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}アクセスURL: ${NC}${YELLOW}http://localhost:$PORT${NC}"
echo -e "${BLUE}API Server: ${NC}${YELLOW}http://localhost:$PORT/api${NC}"
echo ""
echo -e "${YELLOW}ログを表示中... (Ctrl+C で終了)${NC}"
echo ""

# トラップを設定してクリーンアップ
trap 'echo -e "\n${RED}✗ アプリケーションを停止しました${NC}"; exit 0' INT TERM

# `pnpm dev` は開発モードで Vite ミドルウェア込みの Express サーバーを起動するため、
# フロントエンドとバックエンドは同一ポートで提供される。
NODE_ENV=development pnpm dev &
DEV_PID=$!

wait "$DEV_PID"

