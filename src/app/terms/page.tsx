import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="ts-text is-link is-small">
          <span className="ts-icon is-arrow-left-icon"></span>
          返回首頁
        </Link>
      </div>

      <h1 className="ts-header is-huge" style={{ marginBottom: '2rem' }}>服務條款</h1>

      <div className="ts-box">
        <div className="ts-content">
          <h2 className="ts-header">1. 服務說明</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            BucketTogether 是一個共享願望清單應用程式，讓使用者可以與親友一起規劃和追蹤目標。
          </p>

          <h2 className="ts-header">2. 使用者責任</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            使用者應對自己在平台上發布的內容負責，不得發布違法、侵權或不當的內容。
          </p>

          <h2 className="ts-header">3. 帳號安全</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            使用者應妥善保管自己的帳號，對帳號下的所有活動負責。
          </p>

          <h2 className="ts-header">4. 服務變更</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            我們保留隨時修改或終止服務的權利，將盡可能提前通知使用者。
          </p>

          <h2 className="ts-header">5. 免責聲明</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            本服務按「現狀」提供，我們不對服務的可用性或資料完整性做出保證。
          </p>

          <div className="ts-text is-secondary is-small" style={{ marginTop: '2rem' }}>
            最後更新日期：2025 年 1 月
          </div>
        </div>
      </div>
    </div>
  )
}
