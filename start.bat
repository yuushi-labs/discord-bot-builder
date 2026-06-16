@echo off
REM Discord Bot Builder - 統合起動スクリプト (Windows)
REM フロントエンド＋バックエンド両方を起動

setlocal enabledelayedexpansion

REM 色定義（Windows 10 以上）
for /F %%A in ('copy /Z "%~f0" nul') do set "BS=%%A"

echo.
echo ╔════════════════════════════════════════╗
echo ║   Discord Bot Builder - Launcher      ║
echo ╚════════════════════════════════════════╝
echo.

REM .env ファイルの確認
if not exist ".env" (
    echo [ERROR] .env ファイルが見つかりません
    echo セットアップガイドを確認してください: SETUP_GUIDE.md
    pause
    exit /b 1
)

echo [OK] .env ファイルを確認しました

REM Node.js のバージョン確認
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js バージョン: %NODE_VERSION%

REM pnpm のインストール確認
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARN] pnpm がインストールされていません。インストール中...
    call npm install -g pnpm
)

for /f "tokens=1" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo [OK] pnpm バージョン: %PNPM_VERSION%

REM 依存関係のインストール
if not exist "node_modules" (
    echo [WARN] 依存関係をインストール中...
    call pnpm install
    echo [OK] 依存関係をインストールしました
)

REM ポート確認
set PORT=3000
netstat -ano | findstr :3000 >nul 2>nul
if %errorlevel% equ 0 (
    echo [ERROR] ポート 3000 は既に使用されています
    echo 別のポートで起動するには: set PORT=3001 ^& start.bat
    pause
    exit /b 1
)

echo [OK] ポート 3000 は利用可能です

REM 起動
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 起動中...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [OK] アプリケーションを起動しました
echo.
echo アクセスURL: http://localhost:%PORT%
echo API Server: http://localhost:%PORT%/api
echo.
echo ログを表示中... (Ctrl+C で終了)
echo.

REM 開発サーバーを起動
set NODE_ENV=development
call pnpm dev

pause
