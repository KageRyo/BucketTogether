import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/lists/[id]/members - 邀請成員加入清單
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
    const { email, role = 'editor' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email 為必填' },
        { status: 400 }
      )
    }

    // TODO: 實作 Supabase INSERT - 建立清單成員邀請
    // 1. 根據 email 查詢使用者是否存在
    // 2. 如存在，在 list_members 表建立記錄
    // 3. 如不存在，可考慮發送邀請通知（需另建 invitations 表）
    const newMember = {
      id: crypto.randomUUID(),
      list_id: listId,
      email,
      role,
      invited_at: new Date().toISOString(),
      joined_at: null,
    }

    return NextResponse.json(
      { data: newMember, message: '邀請已發送' },
      { status: 201 }  // 201 Created - 成功建立邀請
    )
  } catch (error) {
    console.error('邀請失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// GET /api/lists/[id]/members - 取得清單成員
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

    // TODO: 實作 Supabase SELECT - 查詢清單的所有成員
    // 應 JOIN users 表取得成員資料，並確認使用者有權限查看此清單
    const members: any[] = []

    return NextResponse.json(
      { data: members },
      { status: 200 }
    )
  } catch (error) {
    console.error('取得成員失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
