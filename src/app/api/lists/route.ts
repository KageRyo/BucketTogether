import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/lists - 取得使用者的所有清單
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    // TODO: 實作 Supabase SELECT - 查詢使用者擁有或參與的所有清單
    // 應查詢 lists 表並 JOIN list_members 表，根據 session.user 的 lineId 過濾
    const lists: any[] = []

    return NextResponse.json(
      { data: lists },
      { status: 200 }  // 200 OK - 成功讀取
    )
  } catch (error) {
    console.error('取得清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// POST /api/lists - 建立新清單
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
    const { title, description, categories } = body

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: '清單標題為必填' },
        { status: 400 }  // 400 Bad Request - 請求格式錯誤
      )
    }

    // TODO: 實作 Supabase INSERT - 建立新清單
    // 1. 先查詢當前使用者的 user id
    // 2. 在 lists 表建立清單
    // 3. 在 list_members 表建立 owner 關係
    // 4. 在 categories 表建立預設分類
    const newList = {
      id: crypto.randomUUID(),
      title,
      description,
      categories,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: newList, message: '清單建立成功' },
      { status: 201 }  // 201 Created - 成功建立新資源
    )
  } catch (error) {
    console.error('建立清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
