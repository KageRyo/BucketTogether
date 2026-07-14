# 架構與權限

## 請求流程

```text
Next.js page / client component
        │
        ├─ NextAuth session (Credentials or LINE)
        │
        └─ Route Handler
              ├─ session user id
              ├─ input validation
              └─ DataRepository
                    └─ LocalFileRepository (.data/*.json)
```

畫面會隱藏不允許的操作，但最終權限仍由 repository 檢查，不信任從瀏覽器送來的角色或使用者 ID。

## 驗證

- Credentials provider 從本地 repository 驗證 email 與 scrypt 密碼雜湊。
- LINE provider 只在 `LINE_CHANNEL_ID` 與 `LINE_CHANNEL_SECRET` 都存在時啟用。
- LINE 與 Credentials 都會寫入同一組 JWT 欄位：`userId`、`role`、`authProvider`。
- 帳號可透過相同 email 連結 LINE，`authProvider` 會變為 `both`。

## 權限模型

| 角色 | 權限 |
| --- | --- |
| `admin` | 平台管理員，可查看與管理所有本地清單。 |
| `owner` | 可編輯／刪除清單、分類、項目與成員。 |
| `editor` | 可查看清單並新增、修改、刪除項目。 |
| `viewer` | 僅可查看清單與進度。 |

待接受的 membership 不授予清單存取權；只有接受後才生效。

## 資料層

`DataRepository` 是應用程式與實際儲存的邊界。現行 `LocalFileRepository` 具有：

- 單一 process 中的串行化操作。
- 先寫临時檔再 rename 的原子寫入。
- 首次啟動時建立已雜湊的種子帳號與範例清單。
- 所有外傳使用者資料都會排除 `passwordHash`。

本地 JSON 只適合開發與單機演示，不支援多個 server process 同時寫入。正式環境應實作 Supabase adapter。

## 主要目錄

- `src/app`: App Router 畫面與 API route handlers。
- `src/components/lists`: 清單與項目互動畫面。
- `src/lib/auth`: NextAuth Credentials / LINE 設定。
- `src/lib/data`: domain types、repository interface 與本地實作。
- `src/lib/http`: API session、解析與錯誤回應共用工具。
- `supabase/schema.sql`: 未來 Supabase adapter 預備 schema。
