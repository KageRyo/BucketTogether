import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase'

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

    const supabase = createSupabaseAdmin()
    const userId = (session.user as any).supabaseUserId

    if (!userId) {
      return NextResponse.json(
        { error: '使用者資料不完整，請重新登入' },
        { status: 401 }
      )
    }

    // 查詢使用者擁有的清單
    const { data: ownedLists, error: ownedError } = await supabase
      .from('lists')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('查詢清單失敗:', ownedError)
      throw ownedError
    }

    // 查詢每個清單的項目數量
    const listsWithCounts = await Promise.all(
      (ownedLists || []).map(async (list) => {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)

        return {
          ...list,
          isOwner: true,
          itemCount: count || 0,
        }
      })
    )

    // 查詢使用者參與的清單（透過 list_members）
    const { data: memberRecords } = await supabase
      .from('list_members')
      .select('list_id')
      .eq('user_id', userId)

    const participatedListIds = (memberRecords || [])
      .map(m => m.list_id)
      .filter(id => !listsWithCounts.some(l => l.id === id))

    let participatedLists: any[] = []
    if (participatedListIds.length > 0) {
      const { data: pLists } = await supabase
        .from('lists')
        .select('*')
        .in('id', participatedListIds)

      participatedLists = await Promise.all(
        (pLists || []).map(async (list) => {
          const { count } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)

          return {
            ...list,
            isOwner: false,
            itemCount: count || 0,
          }
        })
      )
    }

    const lists = [...listsWithCounts, ...participatedLists]

    return NextResponse.json(
      { data: lists },
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

    const supabase = createSupabaseAdmin()
    const userId = (session.user as any).supabaseUserId

    if (!userId) {
      return NextResponse.json(
        { error: '使用者資料不完整，請重新登入' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, categories } = body

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: '清單標題為必填' },
        { status: 400 }
      )
    }

    // 1. 建立清單
    const { data: newList, error: listError } = await supabase
      .from('lists')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        owner_id: userId,
        is_public: false,
      })
      .select()
      .single()

    if (listError || !newList) {
      console.error('建立清單失敗:', listError)
      throw listError || new Error('建立清單失敗')
    }

    // 2. 建立 owner 的 list_member 記錄
    await supabase
      .from('list_members')
      .insert({
        list_id: newList.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
      })

    // 3. 建立預設分類（如果有提供）
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const categoryInserts = categories
        .filter((c: any) => c.name && c.name.trim())
        .map((category: any, index: number) => ({
          list_id: newList.id,
          name: category.name.trim(),
          color: category.color || '#3b82f6',
          order: index,
        }))

      if (categoryInserts.length > 0) {
        await supabase.from('categories').insert(categoryInserts)
      }
    }

    return NextResponse.json(
      { data: newList, message: '清單建立成功' },
      { status: 201 }
    )
  } catch (error) {
    console.error('建立清單失敗:', error)
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
