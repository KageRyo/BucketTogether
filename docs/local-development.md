# 本地開發

## 環境需求

- Node.js 20.19+
- npm 10+

## 初始化

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`DATA_BACKEND=local` 時不會連線 Supabase。LINE 變數可留空，登入頁就只會顯示帳密表單。

## 本地資料

預設檔案為 `.data/bucket-together.json`，已排除於 Git 版本控制。可用 `LOCAL_DATA_FILE` 改變位置，自動化測試會使用系統暫存目錄，不會污染開發資料。

要重置資料：

1. 停止 `npm run dev`。
2. 刪除 `.data/bucket-together.json`。
3. 重新啟動，首個請求會建立種子資料。

## 種子流程

- Alex 擁有「我們的共同目標」範例清單。
- Jamie 預設會收到這個清單的 editor 邀請。
- 可分別登入兩個帳號，測試接受邀請與共同編輯。
- 管理員帳號可驗證跨清單管理權限。

## 新增功能的完成準則

- domain / repository 權限與驗證有測試。
- API 不信任 client 提供的 user ID 或 role。
- UI 包含 loading、錯誤與空狀態。
- README 或 `docs/` 中對應內容已更新。
- `npm run check` 通過。
