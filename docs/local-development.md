# 本地開發與驗證

需要 Node.js 22（最低 20.19）。

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run check
```

local 模式不需要外部憑證，使用 README 的三個種子帳號。JSON 存於 `.data/bucket-together.json`，舊 schemaVersion 1 自動升級至 2；不會依相同 Email 自動合併 LINE 身分。本地檔案只有單一 process 佇列，不適用於多程序或正式部署。production 一律拒絕 local。

## PostgreSQL integration tests

使用 Docker Desktop WSL integration，不安裝另一個 Docker daemon，也不使用既有資料庫 volume。

```bash
docker run --detach --name bucket-together-test-db \
  --publish 127.0.0.1:55439:5432 \
  --env POSTGRES_PASSWORD=bucket_test \
  --env POSTGRES_DB=bucket_test postgres:17-alpine
TEST_DATABASE_URL=postgres://postgres:bucket_test@127.0.0.1:55439/bucket_test npm test
```

測試只接受名稱以 `_test` 結尾的資料庫，且會清空該測試資料庫的應用資料。沒有 `TEST_DATABASE_URL` 時 PostgreSQL tests 顯示 skipped，不代表整合驗證通過。CI 自動建立獨立 PostgreSQL service 並執行完整 suite。

要在本地以 PostgreSQL 啟動網站，另建空白的 `bucket_dev` 資料庫，在 `.env.local` 設定 `DATA_BACKEND=supabase`、`DATABASE_URL`、`DATABASE_SSL=disable` 後執行 `npm run db:migrate`。本地資料庫不會自動建立測試帳號，可透過設定好的 OAuth 登入建立使用者。

確認測試容器屬於此次工作且無需保留資料後，可停止並移除此專用容器；不要使用全域 prune。

## API differences

清單／項目 PATCH 需要整數 `expectedVersion`；過期版本回傳 409 且不寫入。邀請入口是 `/join#TOKEN`，token 不放在 query/path。登入後使用 same-origin POST `/api/join/preview` 查看名稱及角色，明確確認後 POST `/api/join` 接受；token 只在 tab sessionStorage 暫存。

使用者公開登入只有 LINE／Discord／Google，production 不支援 Credentials。本地測試帳號仍用原本 email/password。所有 mutation 需與 `NEXTAUTH_URL` 相符的 Origin；以 curl 測試時也需提供正確 Origin 及 session cookie。
