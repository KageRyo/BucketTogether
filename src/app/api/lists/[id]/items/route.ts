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

    // TODO: 從 Supabase 取得清單項目
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

    // TODO: 在 Supabase 建立項目
    const newItem = {
      id: crypto.randomUUID(),
      listId,
      title,
      description,
      categoryId,
      priority,
      dueDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
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
