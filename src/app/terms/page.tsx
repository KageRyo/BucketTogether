import Link from 'next/link'
export default function TermsPage() {
  return (
    <main className="ts-container is-narrow" style={{ padding: '3rem 1rem' }}>
      <Link href="/">返回首頁</Link>
      <h1>服務條款</h1>
      <div className="ts-box">
        <div className="ts-content app-stack">
          <section>
            <h2>服務內容</h2>
            <p>
              BucketTogether 公開測試版提供私人共享目標清單。使用者可透過 LINE、Discord 或 Google
              登入，建立清單並邀請親友共同編輯。測試期間功能可能調整，也可能暫停服務。
            </p>
          </section>
          <section>
            <h2>帳號與邀請</h2>
            <p>
              請保護你的登入平台帳號，僅在設定頁綁定自己持有的其他登入身分。邀請連結七天內有效且限一人使用；持有連結的人可以登入並接受邀請，請只分享給預期的對象。擁有者可撤銷未使用的邀請及管理成員。
            </p>
          </section>
          <section>
            <h2>共同內容</h2>
            <p>
              請確保你有權使用及分享所填內容，不得上傳違法、侵權或用於騷擾的內容。編輯成員可修改共同目標，清單擁有者可以移除成員或刪除整份清單。請避免在清單中記錄密碼或其他不適合分享的資料。
            </p>
          </section>
          <section>
            <h2>服務維護</h2>
            <p>
              我們會進行必要維護、速率限制與資料備份。服務可用性仍可能受到網路、第三方登入平台及託管服務影響；重要內容請自行保留副本。
            </p>
          </section>
          <section>
            <h2>刪除與聯絡</h2>
            <p>
              設定頁提供帳號刪除。你擁有的清單會一併刪除；其他清單中的共同編輯內容保留並匿名化。資料處理方式、備份保留期間及聯絡方式請見{' '}
              <Link href="/privacy">隱私權政策</Link>。
            </p>
          </section>
          <p className="ts-text is-secondary is-small">最後更新：2026 年 10 月 18 日</p>
        </div>
      </div>
    </main>
  )
}
