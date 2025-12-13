import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '4rem' }}>
      {/* Hero Section */}
      <div className="ts-center" style={{ marginBottom: '3rem' }}>
        <span className="ts-icon is-huge is-list-check-icon" style={{ color: 'var(--ts-primary-500)' }}></span>
        <h1 className="ts-header is-huge" style={{ marginTop: '1rem' }}>
          BucketTogether
        </h1>
        <p className="ts-text is-secondary is-large">
          與你的另一半或好友一起規劃、追蹤並完成人生目標！
        </p>
      </div>

      {/* Feature Cards */}
      <div className="ts-grid is-3-columns is-relaxed" style={{ marginBottom: '3rem' }}>
        <div className="column">
          <div className="ts-box">
            <div className="ts-content is-center-aligned">
              <span className="ts-icon is-big is-users-icon" style={{ color: 'var(--ts-primary-500)' }}></span>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>共享清單</h3>
              <p className="ts-text is-secondary">
                邀請另一半或好友一起編輯管理清單
              </p>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="ts-box">
            <div className="ts-content is-center-aligned">
              <span className="ts-icon is-big is-palette-icon" style={{ color: 'var(--ts-primary-500)' }}></span>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>自訂分類</h3>
              <p className="ts-text is-secondary">
                依照喜好建立專屬分類標籤
              </p>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="ts-box">
            <div className="ts-content is-center-aligned">
              <span className="ts-icon is-big is-circle-check-icon" style={{ color: 'var(--ts-primary-500)' }}></span>
              <h3 className="ts-header" style={{ marginTop: '0.5rem' }}>進度追蹤</h3>
              <p className="ts-text is-secondary">
                清楚掌握每個目標的完成狀態
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="ts-center">
        <Link href="/login" className="ts-button is-large is-start-icon">
          <span className="ts-icon is-line-icon"></span>
          使用 LINE 登入開始
        </Link>
      </div>

      {/* Footer */}
      <footer className="ts-center" style={{ marginTop: '4rem', paddingBottom: '2rem' }}>
        <p className="ts-text is-secondary is-small">
          © 2025 BucketTogether. Made with ❤️ by Chien-Hsun Chang.
        </p>
      </footer>
    </div>
  )
}
