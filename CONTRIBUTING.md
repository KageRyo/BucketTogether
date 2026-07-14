# Contributing

## 開發流程

1. 從最新的 `main` 建立功能分支。
2. 變更維持單一目的，並同步更新測試與文件。
3. 提交前執行 `npm run check`。
4. 確認 `git diff --check` 沒有格式問題。
5. 通過 Pull Request 合併至 `main`。

## Commit 格式

所有 commit 遵守 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)：

```text
<type>(optional-scope): <description>
```

常用類型：

- `feat`: 新功能。
- `fix`: 錯誤修正。
- `refactor`: 不改變對外行為的重構。
- `test`: 新增或調整測試。
- `docs`: 文件變更。
- `chore`: 工具鏈或維護工作。

範例：

```text
feat(auth): add local credential login
fix(items): enforce viewer write restriction
test(invites): cover accept and reject flows
docs: describe LINE production setup
```

Breaking change 需使用 `!` 或 `BREAKING CHANGE:` footer。

## Push 到 main 前

不得跳過下列檢查：

```bash
npm run lint
npm run type-check
npm test
npm run build
git diff --check
```

若任一檢查失敗，應先修復，不直接推送至 `main`。
