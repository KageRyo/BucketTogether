import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/users/register - 首次登入時註冊/建立使用者
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { lineId, displayName, pictureUrl, email } = body

    if (!lineId || !displayName) {
      return NextResponse.json(
        { error: 'LINE ID 和顯示名稱為必填' },
        { status: 400 }
      )
    }

    // TODO: 檢查使用者是否已存在
    const existingUser = null

    if (existingUser) {
      // 使用者已存在，返回 200
      return NextResponse.json(
        { data: existingUser, message: '使用者已存在', isNew: false },
        { status: 200 }
      )
    }

    // TODO: 在 Supabase 建立新使用者
    const newUser = {
      id: crypto.randomUUID(),
      lineId,
      displayName,
      pictureUrl,
      email,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: newUser, message: '註冊成功', isNew: true },
      { status: 201 }  // 201 Created - 成功建立新使用者
    )
  } catch (error) {
    console.error('註冊失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
