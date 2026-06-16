# Discord Bot Builder - API リファレンス

このドキュメントでは、Discord Bot Builder のバックエンド API エンドポイントを説明します。

---

## 目次

1. [認証](#認証)
2. [プロジェクト管理 API](#プロジェクト管理-api)
3. [ユーザー API](#ユーザー-api)
4. [エラーハンドリング](#エラーハンドリング)

---

## 認証

### 認証方法

すべての API リクエストは、JWT トークンを使用した認証が必要です。

**ヘッダー:**
```
Authorization: Bearer <JWT_TOKEN>
```

### ログイン

#### Discord OAuth ログイン

```
GET /api/discord/callback?code=<AUTHORIZATION_CODE>&state=<STATE>
```

**説明:** Discord OAuth コールバック。ユーザーが Discord でログインした後、このエンドポイントにリダイレクトされます。

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "openId": "discord_user_id",
    "name": "UserName",
    "email": "user@example.com",
    "loginMethod": "discord",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### ログアウト

```
POST /api/trpc/auth.logout
```

**説明:** ユーザーをログアウトします。

**レスポンス:**
```json
{
  "success": true
}
```

---

## プロジェクト管理 API

### プロジェクト一覧取得

```
POST /api/trpc/projects.list
```

**説明:** ログインユーザーのボットプロジェクト一覧を取得します。

**リクエスト:**
```json
{}
```

**レスポンス:**
```json
{
  "projects": [
    {
      "id": 1,
      "userId": 1,
      "name": "My Bot",
      "token": "encrypted_token",
      "workspace": "{...blockly_workspace_xml...}",
      "createdAt": "2026-06-16T10:00:00Z",
      "updatedAt": "2026-06-16T11:00:00Z"
    }
  ]
}
```

### プロジェクト作成

```
POST /api/trpc/projects.create
```

**説明:** 新しいボットプロジェクトを作成します。

**リクエスト:**
```json
{
  "name": "My Bot",
  "token": "YOUR_DISCORD_BOT_TOKEN"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "My Bot",
  "token": "encrypted_token",
  "workspace": "",
  "createdAt": "2026-06-16T10:00:00Z",
  "updatedAt": "2026-06-16T10:00:00Z"
}
```

**エラーレスポンス:**
```json
{
  "error": "Project name is required"
}
```

### プロジェクト取得

```
POST /api/trpc/projects.get
```

**説明:** 特定のプロジェクト情報を取得します。

**リクエスト:**
```json
{
  "id": 1
}
```

**レスポンス:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "My Bot",
  "token": "encrypted_token",
  "workspace": "{...blockly_workspace_xml...}",
  "createdAt": "2026-06-16T10:00:00Z",
  "updatedAt": "2026-06-16T11:00:00Z"
}
```

### プロジェクト更新

```
POST /api/trpc/projects.update
```

**説明:** プロジェクト情報を更新します。

**リクエスト:**
```json
{
  "id": 1,
  "name": "Updated Bot Name",
  "workspace": "{...blockly_workspace_xml...}"
}
```

**レスポンス:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Updated Bot Name",
  "token": "encrypted_token",
  "workspace": "{...blockly_workspace_xml...}",
  "createdAt": "2026-06-16T10:00:00Z",
  "updatedAt": "2026-06-16T12:00:00Z"
}
```

### プロジェクト削除

```
POST /api/trpc/projects.delete
```

**説明:** プロジェクトを削除します。

**リクエスト:**
```json
{
  "id": 1
}
```

**レスポンス:**
```json
{
  "success": true
}
```

---

## ユーザー API

### 現在のユーザー情報取得

```
POST /api/trpc/auth.me
```

**説明:** ログイン中のユーザー情報を取得します。

**リクエスト:**
```json
{}
```

**レスポンス:**
```json
{
  "id": 1,
  "openId": "discord_user_id",
  "name": "UserName",
  "email": "user@example.com",
  "loginMethod": "discord",
  "role": "user",
  "createdAt": "2026-06-16T10:00:00Z",
  "lastSignedIn": "2026-06-16T11:00:00Z"
}
```

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### 一般的なエラーコード

| コード | HTTP ステータス | 説明 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 認証が必要です |
| `FORBIDDEN` | 403 | アクセス権限がありません |
| `NOT_FOUND` | 404 | リソースが見つかりません |
| `VALIDATION_ERROR` | 400 | リクエスト検証エラー |
| `INTERNAL_ERROR` | 500 | サーバーエラー |

### エラーレスポンス例

**認証エラー:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

**検証エラー:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Project name is required"
  }
}
```

---

## レート制限

- **制限:** 1分間に 100 リクエスト
- **ヘッダー:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## コード例

### JavaScript/TypeScript

```typescript
// プロジェクト一覧取得
const response = await fetch('/api/trpc/projects.list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({})
});

const data = await response.json();
console.log(data.projects);
```

### Python

```python
import requests

# プロジェクト作成
response = requests.post(
    'http://localhost:3000/api/trpc/projects.create',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'name': 'My Bot',
        'token': 'YOUR_DISCORD_BOT_TOKEN'
    }
)

project = response.json()
print(project['id'])
```

### cURL

```bash
# プロジェクト一覧取得
curl -X POST http://localhost:3000/api/trpc/projects.list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# プロジェクト作成
curl -X POST http://localhost:3000/api/trpc/projects.create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bot",
    "token": "YOUR_DISCORD_BOT_TOKEN"
  }'
```

---

## ベストプラクティス

1. **トークンを安全に保管**
   - トークンをクライアント側に保存しない
   - HTTPS のみを使用

2. **エラーハンドリング**
   - すべてのレスポンスをチェック
   - エラーコードに基づいて適切に対応

3. **レート制限の尊重**
   - `X-RateLimit-Remaining` を確認
   - 必要に応じて指数バックオフを実装

4. **タイムアウト設定**
   - 適切なタイムアウトを設定
   - 長時間の操作は非同期で実装

---

**最終更新:** 2026-06-16
