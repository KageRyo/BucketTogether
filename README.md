# BucketTogether

BucketTogether 是給情侶、朋友與小團體一起規劃、分類並完成共同目標的清單應用。

目前程式提供本地開發模式及公開測試版所需的伺服器功能。預設資料寫入 `.data/bucket-together.json`；正式環境使用 Supabase PostgreSQL，支援 LINE、Discord、Google 登入。外部 OAuth 憑證、託管與實際上線驗收仍需依部署文件完成。

## 已完成功能

- 本地帳號密碼登入供開發測試；正式管理員使用 OAuth 登入。
- LINE、Discord、Google OAuth，透過設定頁主動綁定登入方式，不依 Email 自動合併。
- 清單建立、查看、設定、刪除。
- 擁有權轉交給已加入的成員，原擁有者保留編輯權限。
- 完整清單 JSON／CSV 匯出，排除成員及邀請資訊，詳見 [匯出格式](docs/list-export.md)。
- 自訂分類與項目 CRUD、優先級、到期日、完成進度。
- 七天有效、單次使用且可撤銷的邀請連結；保留舊邀請的接受／拒絕與成員管理。
- 完整項目編輯、每 15 秒更新及版本衝突提示，保留尚未儲存的草稿。
- 刪除帳號、刪除擁有的清單、匿名化其他清單的貢獻，並使舊 session 失效。
- PostgreSQL 交易、跨實例速率限制、版本化 migrations 與健康檢查。
- `admin` / `owner` / `editor` / `viewer` 權限檢查，API 不依賴前端隱藏按鈕來限制操作。
- 本地 JSON 原子寫入、兩種 repository 共用的行為測試，以及 GitHub Actions 驗證。

## 快速開始

建議 Node.js 22，最低 20.19。

```bash
npm ci
cp .env.example .env.local
npm run dev
```

開啟 <http://localhost:3000>，再用下列本地帳號登入：

| 用途       | Email                | 密碼         | 平台角色 |
| ---------- | -------------------- | ------------ | -------- |
| 管理員     | `admin@bucket.local` | `Admin123!`  | `admin`  |
| 清單擁有者 | `alex@bucket.local`  | `Tester123!` | `user`   |
| 邀請測試   | `jamie@bucket.local` | `Tester123!` | `user`   |

這些是開發用種子帳號，不得用於正式環境。要重置本地資料，停止開發伺服器後刪除 `.data/bucket-together.json`，下次請求會自動重建種子資料。

## 驗證指令

```bash
npm run lint
npm run type-check
npm test
npm run build
```

PostgreSQL 整合測試需依 [本地開發](docs/local-development.md) 設定 `TEST_DATABASE_URL`；未設定時會跳過。

Push 到 `main` 前必須全數通過，也可一次執行：

```bash
npm run check
```

## 正式環境

採 Vercel＋Supabase，先設定 `.env.example` 的三組 OAuth、資料庫及公開政策資訊，執行 `npm run db:migrate` 與 `npm run config:check`。正式環境禁止本地 JSON、開發種子帳號及停用 TLS。完整程序見 [部署文件](docs/deployment.md)。

## 文件

- [架構與權限](docs/architecture.md)
- [本地開發](docs/local-development.md)
- [正式部署與 LINE / Supabase 轉接](docs/deployment.md)
- [貢獻與 Conventional Commits](CONTRIBUTING.md)

## License

[MIT](LICENSE)
