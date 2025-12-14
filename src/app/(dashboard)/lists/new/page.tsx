'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CategoryInput {
  name: string
  color: string
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

export default function NewListPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<CategoryInput[]>([
    { name: '旅遊', color: '#3b82f6' },
    { name: '美食', color: '#ef4444' },
    { name: '體驗', color: '#22c55e' },
  ])
  const [inviteEmail, setInviteEmail] = useState('')

  const addCategory = () => {
    const colorIndex = categories.length % defaultColors.length
    setCategories([...categories, { name: '', color: defaultColors[colorIndex] }])
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const updateCategory = (index: number, field: keyof CategoryInput, value: string) => {
    const updated = [...categories]
    updated[index][field] = value
    setCategories(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 呼叫 POST /api/lists 建立清單
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categories: categories.filter(c => c.name.trim()),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '建立清單失敗')
      }

      // 如有 inviteEmail，發送邀請
      if (inviteEmail && result.data?.id) {
        await fetch(`/api/lists/${result.data.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        })
      }

      // 成功後導向到新清單頁面
      router.push(`/lists/${result.data.id}`)
    } catch (err) {
      console.error('建立清單失敗:', err)
      setError(err instanceof Error ? err.message : '建立清單失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="ts-container is-narrow" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Error Message */}
      {error && (
        <div className="ts-notice is-negative" style={{ marginBottom: '1rem' }}>
          <div className="content">{error}</div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="ts-text is-link is-small">
          <span className="ts-icon is-arrow-left-icon"></span>
          返回首頁
        </Link>
        <h1 className="ts-header is-large" style={{ marginTop: '0.5rem' }}>
          建立新清單
        </h1>
        <p className="ts-text is-secondary">
          設定你的願望清單基本資訊，並邀請夥伴一起加入
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
          <div className="ts-content">
            <h3 className="ts-header">基本資訊</h3>
            
            <div className="ts-wrap is-vertical" style={{ gap: '1rem', marginTop: '1rem' }}>
              <div className="ts-input is-fluid">
                <input
                  type="text"
                  placeholder="清單名稱（例如：2025 年度目標）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="ts-input is-fluid">
                <textarea
                  placeholder="清單描述（選填）"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
          <div className="ts-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="ts-header">分類標籤</h3>
              <button type="button" onClick={addCategory} className="ts-button is-small is-outlined">
                <span className="ts-icon is-plus-icon"></span>
                新增分類
              </button>
            </div>
            <p className="ts-text is-secondary is-small">自訂分類幫助你組織願望清單項目</p>

            <div className="ts-wrap is-vertical" style={{ gap: '0.5rem', marginTop: '1rem' }}>
              {categories.map((category, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => updateCategory(index, 'color', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                  <div className="ts-input is-fluid">
                    <input
                      type="text"
                      placeholder="分類名稱"
                      value={category.name}
                      onChange={(e) => updateCategory(index, 'name', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="ts-button is-icon is-ghost"
                  >
                    <span className="ts-icon is-xmark-icon"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invite Member */}
        <div className="ts-box" style={{ marginBottom: '1.5rem' }}>
          <div className="ts-content">
            <h3 className="ts-header">邀請夥伴</h3>
            <p className="ts-text is-secondary is-small">邀請你的另一半或好友一起編輯這個清單</p>

            <div className="ts-input is-fluid" style={{ marginTop: '1rem' }}>
              <input
                type="email"
                placeholder="輸入夥伴的 Email（選填，可稍後邀請）"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link href="/dashboard" className="ts-button is-outlined">
            取消
          </Link>
          <button type="submit" className="ts-button is-primary" disabled={isLoading || !title}>
            {isLoading ? (
              <>
                <span className="ts-icon is-spinning is-spinner-icon"></span>
                建立中...
              </>
            ) : (
              <>
                <span className="ts-icon is-check-icon"></span>
                建立清單
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
