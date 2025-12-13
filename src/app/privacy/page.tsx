import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" className="ts-text is-link is-small">
          <span className="ts-icon is-arrow-left-icon"></span>
          返回首頁
        </Link>
      </div>

      <h1 className="ts-header is-huge" style={{ marginBottom: '2rem' }}>隱私權政策</h1>

      <div className="ts-box">
        <div className="ts-content">
          <h2 className="ts-header">1. 資料收集</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            我們透過 LINE Login 收集您的基本資料，包括顯示名稱、頭像和電子郵件（如有提供）。
            這些資料僅用於提供服務和改善使用者體驗。
          </p>

          <h2 className="ts-header">2. 資料使用</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            您的資料將用於：
          </p>
          <ul className="ts-list is-unordered" style={{ marginBottom: '1.5rem' }}>
            <li>提供帳號識別和登入功能</li>
            <li>顯示您的個人資料給共享清單的成員</li>
            <li>發送服務相關通知</li>
          </ul>

          <h2 className="ts-header">3. 資料儲存</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            您的資料儲存在 Supabase 雲端服務，採用業界標準的安全措施保護。
          </p>

          <h2 className="ts-header">4. 資料分享</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            我們不會將您的個人資料出售或分享給第三方，除非法律要求。
          </p>

          <h2 className="ts-header">5. 您的權利</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            您有權要求查看、更正或刪除您的個人資料。如需行使這些權利，請聯繫我們。
          </p>

          <h2 className="ts-header">6. Cookie 使用</h2>
          <p className="ts-text" style={{ marginBottom: '1.5rem' }}>
            我們使用 Cookie 來維持您的登入狀態和偏好設定。
          </p>

          <div className="ts-text is-secondary is-small" style={{ marginTop: '2rem' }}>
            最後更新日期：2025 年 1 月
          </div>
        </div>
      </div>
    </div>
  )
}
