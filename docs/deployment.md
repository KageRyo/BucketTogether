# 正式部署與 LINE / Supabase 轉接

目前版本完成本地 MVP，但 `LocalFileRepository` 不是正式環境儲存方案。在上線前應完成以下工作。

## LINE Login

1. 在 LINE Developers 建立 LINE Login channel。
2. 設定 callback URL：`https://YOUR_DOMAIN/api/auth/callback/line`。
3. 設定正式環境變數：

```text
NEXTAUTH_URL=https://YOUR_DOMAIN
NEXTAUTH_SECRET=<strong-random-secret>
LINE_CHANNEL_ID=<channel-id>
LINE_CHANNEL_SECRET=<channel-secret>
```

Credentials provider 可保留給管理員與受控測試帳號，但不應將本地種子帳號與預設密碼帶到 production。

## Supabase adapter

1. 使用 `supabase/schema.sql` 建立資料結構。
2. 實作 `DataRepository` 的 Supabase 版本。
3. 讓 `getDataRepository()` 依 `DATA_BACKEND=supabase` 選擇 adapter。
4. 將測試套件重用在 Supabase adapter contract tests。
5. 確認邀請、角色與 admin 繞過行為在 API 與資料庫層都受保護。

## 安全邊界

NextAuth LINE 並不等同於 Supabase Auth。未來 adapter 若使用 service role key，service role 會繞過 RLS，因此：

- service role key 只能出現在 server runtime。
- 所有查詢都必須使用 NextAuth session user ID 限制資料範圍。
- 應保留 repository 的權限測試，並針對 production adapter 新增整合測試。
- 不要將 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 當成 server 管理密鑰。

`supabase/schema.sql` 預設對 anon/authenticated 客戶端請求關閉存取；實際 RLS 或 server-only 策略應在 adapter 實作時完成並驗證。
