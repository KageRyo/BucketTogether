# BucketTogether

BucketTogether 是給情侶、朋友與小團體一起規劃、分類並完成共同目標的清單應用。

目前版本是可獨立運作的本地 MVP：不需要 Supabase 或 LINE 設定，資料預設寫入 `.data/bucket-together.json`。LINE Login 仍保留在 NextAuth 驗證流程中，只要正式環境提供對應變數就會啟用。

## 已完成功能

- 帳號密碼登入，供本地測試與管理員使用。
- 可選的 LINE OAuth 登入，與帳密共用同一個 session 與使用者權限模型。
- 清單建立、查看、設定、刪除。
- 自訂分類與項目 CRUD、優先級、到期日、完成進度。
- 邀請現有使用者、接受／拒絕邀請與成員管理。
- `admin` / `owner` / `editor` / `viewer` 權限檢查，API 不依賴前端隱藏按鈕來限制操作。
- 本地 JSON 原子寫入與 Vitest 資料隔離測試。

## 快速開始

需要 Node.js 20.19 以上版本。

```bash
npm ci
cp .env.example .env.local
npm run dev
```

開啟 <http://localhost:3000>，再用下列本地帳號登入：

| 用途 | Email | 密碼 | 平台角色 |
| --- | --- | --- | --- |
| 管理員 | `admin@bucket.local` | `Admin123!` | `admin` |
| 清單擁有者 | `alex@bucket.local` | `Tester123!` | `user` |
| 邀請測試 | `jamie@bucket.local` | `Tester123!` | `user` |

這些是開發用種子帳號，不得用於正式環境。要重置本地資料，停止開發伺服器後刪除 `.data/bucket-together.json`，下次請求會自動重建種子資料。

## 驗證指令

```bash
npm run lint
npm run type-check
npm test
npm run build
```

Push 到 `main` 前必須全數通過，也可一次執行：

```bash
npm run check
```

## 文件

- [架構與權限](docs/architecture.md)
- [本地開發](docs/local-development.md)
- [正式部署與 LINE / Supabase 轉接](docs/deployment.md)
- [貢獻與 Conventional Commits](CONTRIBUTING.md)

## License

[MIT](LICENSE)
