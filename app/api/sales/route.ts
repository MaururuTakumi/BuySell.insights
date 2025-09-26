import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // 認証未実装のため、Service Roleクライアントを使用
  // TODO: 認証実装後はgetSupabaseServerClient()に変更
  const supabase = getSupabaseServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const brand = searchParams.get('brand');
  const type = searchParams.get('type');
  const rank = searchParams.get('rank');
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // クエリの構築
    let query = supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // フィルター条件の適用
    if (brand) {
      query = query.eq('brand', brand.toUpperCase());
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (rank) {
      query = query.eq('rank', rank);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching sales data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sales data' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: data || [],
        total: count || 0,
        filters: { brand, type, rank },
        pagination: { limit, offset }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in sales API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
