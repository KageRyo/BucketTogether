# 公開測試版部署

本文件是尚待營運者執行的部署程序；本地測試通過不代表正式服務已上線。

## 1. Supabase

建立獨立的測試與正式 Supabase 專案，選定地區並核對目前的費用、連線額度、備份能力及保留天數。使用支援 IPv4 的 transaction pooler connection string 作為伺服器 `DATABASE_URL`（通常 port 6543，帳號含 project reference）。密碼中的特殊字元必須 URL encode。

保留 TLS 憑證驗證；若服務商要求額外 CA，透過 `NODE_EXTRA_CA_CERTS` 提供受信任 CA，不能關閉驗證。遷移使用者需有建立表格及啟用 RLS 的權限。伺服器連線需能存取這些 RLS 保護的表（Supabase 管理連線可繞過 RLS），絕不提供給瀏覽器。

從乾淨資料庫套用版本化遷移：

```bash
npm ci
# 在 .env.local 或安全的環境變數中設定 DATABASE_URL
npm run db:migrate
```

遷移會以交易及 advisory lock 執行並記錄 checksum，重跑不重複套用。已執行的 migration 不可修改。舊 `schema.sql` 原為未執行的草稿；若你曾手動套用舊草稿，先匯出並規劃轉換，不可在既有資料庫直接覆蓋本遷移。現有 JSON 資料只在 local 模式自動升級，不會自動匯入正式資料庫或帶入測試帳號。

## 2. OAuth 與 Vercel

在 LINE Developers、Discord Developer Portal、Google Cloud 各建立測試與正式應用，分別註冊：

```text
https://YOUR_DOMAIN/api/auth/callback/line
https://YOUR_DOMAIN/api/auth/callback/discord
https://YOUR_DOMAIN/api/auth/callback/google
```

LINE 僅要求 OpenID/profile，不要求 Email 權限；Discord 使用 identify/email；Google 使用 OpenID/profile/email。LINE 若要額外取得 Email，須另依 [LINE 官方說明](https://developers.line.biz/en/docs/line-login/integrate-line-login/#requesting-permission-to-access-the-users-email-address) 申請權限；目前登入不依賴 Email。確認公開應用狀態及平台要求的 consent 設定。不要以 production 憑證測試任意 PR preview 網域。

Vercel 連接儲存庫，使用 Node.js 22、`npm ci` 及 `npm run build`。啟用正式網域 HTTPS，將以下變數分別設定在正確環境：

- `DATA_BACKEND=supabase`、`DATABASE_URL`。
- `NEXTAUTH_URL=https://YOUR_DOMAIN`、`NEXTAUTH_SECRET`（至少 32 字元的獨立隨機密鑰）。
- `.env.example` 的 LINE、Discord、Google 共六個憑證變數。
- `NEXT_PUBLIC_CONTACT_EMAIL`、`NEXT_PUBLIC_DATA_REGION`、`NEXT_PUBLIC_BACKUP_RETENTION_DAYS`，須與真實聯絡方式、地區及保留政策一致；這些值公開且須在 build 時提供。

在正確環境執行 `npm run config:check`。缺少憑證、使用 HTTP、弱密鑰、local 儲存或停用 TLS 都不能開放服務。Credentials 在 production 完全停用；管理員使用 OAuth 登入後由營運者在資料庫授予 admin，禁止自動以 Email 提升角色。

## 3. 驗證與開放

1. `npm run check`，另在獨立測試資料庫執行 PostgreSQL contract tests，確認 CI 通過。
2. 在測試部署完成三種真實 OAuth 的首次／再次登入、綁定及綁定衝突；檢查取消登入、過期綁定及返回邀請頁。
3. 用兩個不同平台帳號走完建清單、分享、接受、編輯、完成、角色限制、撤銷邀請及刪帳；舊 session 應失效。
4. 在正式部署檢查 `/api/health`、手機操作、錯誤紀錄及備份還原程序，先小規模邀請，再公開推廣。
5. 在 GitHub 將 `CI / check` 設為必要檢查，再開啟正式分支自動部署；PR preview 不得共用正式資料庫。

Vercel rate-limit IP 信任其覆寫的 `x-real-ip`。若改用其他代理，先調整並驗證可信 IP 來源；目前其他環境使用共用 auth bucket，不信任任意 forwarded-for。

## 4. 備份、還原與刪除要求

使用所選 Supabase 方案支援的備份／PITR，或安排以相容 PostgreSQL 版本的 `pg_dump --format=custom --no-owner --no-acl` 匯出。備份連線使用 direct/session pooler，不要使用 transaction pooler。憑證透過受限 `.pgpass`/service file 或環境注入；禁止提交憑證、dump 或私鑰。

離站備份應立即以 GPG 等工具加密，存放在有存取控制與生命週期刪除的儲存空間，保留期間應等於政策設定值。還原使用 `pg_restore --no-owner --no-acl --exit-on-error`，僅對新建、隔離的資料庫執行；不將演練指向正式連線。

至少在開放前及每次 schema 重大變更後演練：建立測試清單與成員 → 備份 → 還原到新資料庫 → 比較資料筆數 → 驗證權限、邀請與版本衝突 → 移除演練資源。

另以受限營運紀錄追蹤備份保留期間內已完成的刪帳要求；若還原舊備份，在重新開放前重套這些刪除，避免復原已刪除的帳號。不要將私人內容放入公開 issue。

每日執行資料維護，並核對託管／應用紀錄保留設定：

```sql
DELETE FROM rate_limits WHERE expires_at < now() - interval '1 day';
DELETE FROM invite_links WHERE expires_at < now() - interval '30 days';
```

## 5. 監測與回復

設定外部 uptime monitor 定期讀取 `/api/health`，非 200 時通知維護者；在 Vercel Logs 對 `request_error`、`api_error`、`auth_error` 設定告警並限制存取。這些外部告警需在託管服務中實際設定，本儲存庫不會自動建立它們。

部署失敗回復上一個已驗證版本；版本化資料庫遷移採向前修正，不以刪表回復。必要時暫停入口及寫入，再依已演練的程序還原。切換 NEXTAUTH_SECRET 會讓既有 session 失效，應視為明確的營運操作。
