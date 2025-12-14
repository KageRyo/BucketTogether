import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase'

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

    const supabase = createSupabaseAdmin()
    const userId = (session.user as any).supabaseUserId

    // 1. 取得清單基本資料
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: '找不到該清單' },
        { status: 404 }
      )
    }

    // 2. 檢查使用者權限（是否為 owner 或 member）
    const isOwner = list.owner_id === userId
    
    if (!isOwner) {
      const { data: membership } = await supabase
        .from('list_members')
        .select('role')
        .eq('list_id', id)
        .eq('user_id', userId)
        .single()

      if (!membership && !list.is_public) {
        return NextResponse.json(
          { error: '您沒有權限查看此清單' },
          { status: 403 }
        )
      }
    }

    // 3. 取得清單的分類
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('list_id', id)
      .order('order', { ascending: true })

    // 4. 取得清單的項目
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', id)
      .order('order', { ascending: true })

    // 5. 取得清單的成員
    const { data: members } = await supabase
      .from('list_members')
      .select(`
        id,
        role,
        joined_at,
        user_id
      `)
      .eq('list_id', id)

    // 取得成員的使用者資料
    const memberUserIds = (members || []).map(m => m.user_id)
    let memberUsers: any[] = []
    if (memberUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, picture_url')
        .in('id', memberUserIds)
      memberUsers = users || []
    }

    // 合併成員資料
    const membersWithUsers = (members || []).map(member => {
      const user = memberUsers.find(u => u.id === member.user_id)
      return {
        ...member,
        user: user || null,
      }
    })

    // 計算完成進度
    const totalItems = items?.length || 0
    const completedItems = items?.filter(i => i.is_completed).length || 0

    return NextResponse.json(
      { 
        data: {
          ...list,
          categories: categories || [],
          items: items || [],
          members: membersWithUsers,
          stats: {
            totalItems,
            completedItems,
            progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          },
          isOwner,
        }
      },
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

    const supabase = createSupabaseAdmin()
    const userId = (session.user as any).supabaseUserId
    const body = await request.json()

    // 檢查使用者是否有編輯權限
    const { data: list } = await supabase
      .from('lists')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!list) {
      return NextResponse.json(
        { error: '找不到該清單' },
        { status: 404 }
      )
    }

    const isOwner = list.owner_id === userId
    if (!isOwner) {
      const { data: membership } = await supabase
        .from('list_members')
        .select('role')
        .eq('list_id', id)
        .eq('user_id', userId)
        .single()

      if (!membership || membership.role === 'viewer') {
        return NextResponse.json(
          { error: '您沒有權限編輯此清單' },
          { status: 403 }
        )
      }
    }

    // 更新清單
    const { title, description, is_public } = body
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (is_public !== undefined) updateData.is_public = is_public

    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      { data: updatedList, message: '清單更新成功' },
      { status: 200 }
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

    const supabase = createSupabaseAdmin()
    const userId = (session.user as any).supabaseUserId

    // 只有 owner 可以刪除清單
    const { data: list } = await supabase
      .from('lists')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!list) {
      return NextResponse.json(
        { error: '找不到該清單' },
        { status: 404 }
      )
    }

    if (list.owner_id !== userId) {
      return NextResponse.json(
        { error: '只有清單擁有者可以刪除清單' },
        { status: 403 }
      )
    }

    // 刪除清單（相關的 items、categories、list_members 會因 CASCADE 自動刪除）
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json(
      { message: '清單已刪除' },
      { status: 200 }
    )
    )
  } catch (error) {
    console.error('刪除清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
