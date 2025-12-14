import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/lists/[id] - 取得單一清單
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

    // TODO: 實作 Supabase SELECT - 根據 id 查詢單一清單
    // 應確認使用者有權限存取此清單（owner 或 member）
    const list = null

    if (!list) {
      return NextResponse.json(
        { error: '找不到該清單' },
        { status: 404 }  // 404 Not Found - 資源不存在
      )
    }

    return NextResponse.json(
      { data: list },
      { status: 200 }
    )
  } catch (error) {
    console.error('取得清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// PATCH /api/lists/[id] - 更新清單
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // TODO: 實作 Supabase UPDATE - 更新清單資料
    // 應確認使用者有編輯權限（owner 或 editor）
    const updatedList = {
      id,
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: updatedList, message: '清單更新成功' },
      { status: 200 }  // 200 OK - 成功更新
    )
  } catch (error) {
    console.error('更新清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}

// DELETE /api/lists/[id] - 刪除清單
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    // TODO: 實作 Supabase DELETE - 刪除清單
    // 只有 owner 可以刪除清單，相關的 items、categories、list_members 會因 CASCADE 自動刪除

    return NextResponse.json(
      { message: '清單已刪除' },
      { status: 200 }  // 200 OK 或 204 No Content
    )
  } catch (error) {
    console.error('刪除清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
