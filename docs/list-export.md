# 清單匯出

已獲清單存取權的使用者（包含 viewer）可在清單頁下載 JSON 或 CSV；待接受的邀請不授權匯出。每次下載會重新檢查登入及清單權限，沿用管理員既有存取規則。匯出完整清單，不受畫面篩選影響，也不會刪除或修改資料。

API：`GET /api/lists/{id}/export?format=json`（預設）或 `format=csv`。回應為 UTF-8 附件，檔名為 `bucket-list-{清單 ID}-{UTC 日期}.{格式}`，禁止快取。每個使用者每分鐘最多 10 次；超限回傳 429。單一輸出上限 **4 MiB**（含 UTF-8 編碼與 BOM），超過則回傳 400，不會截斷資料。空清單可正常下載；目前沒有匯入／還原功能。4 MiB 上限留在 [Vercel 4.5 MB 回應限制](https://vercel.com/docs/functions/limitations)之內，不依賴部署平台的串流行為。

## JSON schemaVersion 1

頂層固定為 `schemaVersion`、`exportedAt`（UTC ISO 時間）、`list`、`categories`、`items`：

- `list`：`id`、`title`、`description`、`coverImage`、`createdAt`、`updatedAt`。
- `categories[]`：`id`、`name`、`color`、`order`、`createdAt`。
- `items[]`：`id`、`categoryId`、`title`、`description`、`isCompleted`、`completedAt`、`dueDate`、`priority`、`order`、`createdAt`、`updatedAt`。

清單、分類及項目 ID 保留穩定關聯；`categoryId: null` 表示未分類。選填欄位保留 `null`，期限為 `YYYY-MM-DD`，優先級為 `low`／`medium`／`high` 或 `null`。排序值與完成時間保留；內部更新版本、擁有者／作者／完成人帳號 ID、成員名冊、Email、OAuth、session 及邀請資訊不匯出。使用者自行輸入在標題或描述中的文字仍會完整保留。

## CSV schema v1

CSV 為每個項目一列，欄位依序是：

```text
id,category_id,category,title,description,is_completed,completed_at,due_date,priority,order,created_at,updated_at
```

未分類／空值為空字串，完成狀態為 `true`／`false`。空清單僅有標頭。CSV 不包含清單屬性或沒有項目的分類；需要完整封存時請選 JSON。

輸出含 UTF-8 BOM，記錄使用 CRLF；所有儲存格加雙引號，內含雙引號重複轉義，保留逗號及換行。若儲存格在空白或控制字元之後以 `=`、`+`、`-`、`@` 開頭，會在最前面加單引號，降低試算表公式執行風險；部分軟體會顯示該單引號。JSON 保留原文。
