import Link from 'next/link'
export default function PrivacyPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  const region = process.env.NEXT_PUBLIC_DATA_REGION || '本地開發環境（正式環境尚未設定）'
  const retention = process.env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS
  return (
    <main className="ts-container is-narrow" style={{ padding: '3rem 1rem' }}>
      <Link href="/">返回首頁</Link>
      <h1>隱私權政策</h1>
      <div className="ts-box">
        <div className="ts-content app-stack">
          <section>
            <h2>我們處理的資料</h2>
            <p>
              使用 LINE、Discord 或 Google 登入時，我們取得該平台的帳號識別碼、顯示名稱、頭像及
              Email（平台有提供時）。Email
              不是必要資料，也不會用於自動合併不同平台的帳號。我們不儲存你的平台密碼或 OAuth
              存取／更新權杖。
            </p>
            <p>
              我們也儲存你建立的清單、分類、目標、完成紀錄、成員關係及邀請紀錄。本地測試模式另有使用
              scrypt 雜湊的測試帳號密碼；公開服務不提供帳密登入。
            </p>
          </section>
          <section>
            <h2>資料用途與共享</h2>
            <p>
              資料用於登入、維持帳號綁定、提供私人共享清單及處理邀請。已加入清單的成員可查看清單內容、成員名稱與頭像；成員
              API 不提供其他成員的
              Email。持有有效邀請連結並登入者，可先查看清單名稱及受邀角色，接受後才能查看內容。
            </p>
            <p>
              我們使用 Vercel 託管網站及 Supabase 託管 PostgreSQL
              資料庫；登入流程也會與你選擇的平台交換必要資料。這些服務商依其服務條件處理資料。我們不出售個人資料。
            </p>
          </section>
          <section>
            <h2>儲存、紀錄與保留</h2>
            <p>
              資料庫地區：{region}
              。託管商可能於其他地區處理請求及服務紀錄。應用程式錯誤紀錄僅包含錯誤種類、路由樣板及錯誤識別碼；不主動記錄目標內容、邀請
              token 或 OAuth 授權碼。託管平台本身的存取紀錄由營運者另行限制存取及保留期間。
            </p>
            <p>
              帳號存在期間保留提供服務所需的資料。正式環境備份保留 {retention || '尚未設定的'}{' '}
              天，到期移除；若還原較舊備份，營運者須重新套用期間內的刪除要求。
            </p>
          </section>
          <section>
            <h2>刪除與聯絡</h2>
            <p>
              你可以在設定頁刪除帳號。這會刪除登入綁定、你擁有的清單與相關資料，並退出其他清單。你在其他人的清單中編輯的共同內容會保留，作者與完成者會改為匿名；備份中的資料依保留期間到期移除。
            </p>
            <p>
              若需查閱、更正或提出其他資料處理要求，請
              {contact ? (
                <a href={`mailto:${contact}`}>聯絡 {contact}</a>
              ) : (
                <a href="https://github.com/KageRyo/BucketTogether">透過專案頁聯絡維護者</a>
              )}
              。請勿在公開 issue 提供私人清單或登入憑證。
            </p>
          </section>
          <section>
            <h2>Cookie 與瀏覽器儲存</h2>
            <p>
              我們使用必要 Cookie 維持登入、驗證 OAuth 流程及處理你主動發起的帳號綁定。邀請連結的
              token 會暫存在目前分頁的 sessionStorage，讓登入後能接續接受邀請，接受或刪帳後移除。
            </p>
          </section>
          <p className="ts-text is-secondary is-small">最後更新：2026 年 10 月 18 日</p>
        </div>
      </div>
    </main>
  )
}
