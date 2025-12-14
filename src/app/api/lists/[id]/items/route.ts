import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/lists/[id]/items - 取得清單所有項目
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    // TODO: 實作 Supabase SELECT - 查詢清單的所有項目
    // 應使用 list_id (id) 過濾並依 order 排序，同時確認使用者有權限
    const items: any[] = []

    return NextResponse.json(
      { data: items },
      { status: 200 }
    )
  } catch (error) {
    console.error('取得項目失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// POST /api/lists/[id]/items - 新增項目到清單
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id: listId } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, categoryId, priority, dueDate } = body

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: '項目標題為必填' },
        { status: 400 }
      )
    }

    // TODO: 實作 Supabase INSERT - 在 items 表建立新項目
    // 應設定 created_by 為當前使用者，並計算正確的 order 值
    const newItem = {
      id: crypto.randomUUID(),
      list_id: listId,
      title,
      description,
      category_id: categoryId,
      priority,
      due_date: dueDate,
      is_completed: false,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: newItem, message: '項目新增成功' },
      { status: 201 }  // 201 Created - 成功建立新資源
    )
  } catch (error) {
    console.error('新增項目失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
