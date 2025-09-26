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

  try {
    // ベースクエリの構築
    let baseQuery = supabase.from('sales').select('*');

    // フィルター条件の適用
    if (brand) {
      baseQuery = baseQuery.eq('brand', brand.toUpperCase());
    }
    if (type) {
      baseQuery = baseQuery.eq('type', type);
    }
    if (rank) {
      baseQuery = baseQuery.eq('rank', rank);
    }

    const { data, error } = await baseQuery;

    if (error) {
      console.error('Error fetching metrics data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          data: {
            totalSelling: 0,
            totalAdjusted: 0,
            totalAppraised: 0,
            avgMarginAdj: 0,
            avgMarginApp: 0,
            totalCount: 0,
            rankSummary: [],
            monthlySummary: [],
            marginLeaders: [],
            marginLaggards: [],
          },
          filters: { brand, type, rank },
        },
        { status: 200 }
      );
    }

    // 集計値の計算
    const totalSelling = data.reduce((sum, row) => sum + (row.selling_price || 0), 0);
    const totalAdjusted = data.reduce((sum, row) => sum + (row.adjusted_exp_sale_price || 0), 0);
    const totalAppraised = data.reduce((sum, row) => sum + (row.appraised_price || 0), 0);

    // マージン計算（販売価格と調整価格/査定価格の差額）
    const validAdjustedRows = data.filter(row => row.adjusted_exp_sale_price != null && row.adjusted_exp_sale_price > 0);
    const validAppraisedRows = data.filter(row => row.appraised_price != null && row.appraised_price > 0);

    const avgMarginAdj = validAdjustedRows.length > 0
      ? validAdjustedRows.reduce((sum, row) => {
          const margin = (row.selling_price - row.adjusted_exp_sale_price!) / row.selling_price * 100;
          return sum + margin;
        }, 0) / validAdjustedRows.length
      : 0;

    const avgMarginApp = validAppraisedRows.length > 0
      ? validAppraisedRows.reduce((sum, row) => {
          const margin = (row.selling_price - row.appraised_price!) / row.selling_price * 100;
          return sum + margin;
        }, 0) / validAppraisedRows.length
      : 0;

    // マージン計算（個別行用）
    const margins = data.map(row => ({
      ...row,
      margin_adj: row.adjusted_exp_sale_price
        ? (row.selling_price - row.adjusted_exp_sale_price) / row.selling_price * 100
        : 0,
      margin_app: row.appraised_price
        ? (row.selling_price - row.appraised_price) / row.selling_price * 100
        : 0
    }));

    // ランク別集計
    const rankSummary = Object.entries(
      data.reduce((acc: any, row) => {
        const rank = row.rank || 'UNKNOWN';
        if (!acc[rank]) {
          acc[rank] = { rank, count: 0, totalSelling: 0, avgSelling: 0 };
        }
        acc[rank].count++;
        acc[rank].totalSelling += row.selling_price;
        return acc;
      }, {})
    ).map(([_, value]: [string, any]) => ({
      ...value,
      avgSelling: value.totalSelling / value.count
    }));

    // 月別集計
    const monthlySummary = Object.entries(
      data.reduce((acc: any, row) => {
        const month = row.year_month || row.sale_date.substring(0, 7);
        if (!acc[month]) {
          acc[month] = { month, count: 0, totalSelling: 0, avgSelling: 0 };
        }
        acc[month].count++;
        acc[month].totalSelling += row.selling_price;
        return acc;
      }, {})
    ).map(([_, value]: [string, any]) => ({
      ...value,
      avgSelling: value.totalSelling / value.count
    })).sort((a, b) => a.month.localeCompare(b.month));

    // マージンリーダー/ラガード（上位/下位5件）
    const sortedByMargin = [...margins].sort((a, b) => b.margin_adj - a.margin_adj);
    const marginLeaders = sortedByMargin.slice(0, 5).map(row => ({
      id: row.id,
      brand: row.brand,
      type: row.type,
      model_number: row.model_number,
      selling_price: row.selling_price,
      margin_adj: row.margin_adj,
      sale_date: row.sale_date
    }));

    const marginLaggards = sortedByMargin.slice(-5).reverse().map(row => ({
      id: row.id,
      brand: row.brand,
      type: row.type,
      model_number: row.model_number,
      selling_price: row.selling_price,
      margin_adj: row.margin_adj,
      sale_date: row.sale_date
    }));

    return NextResponse.json(
      {
        data: {
          totalSelling,
          totalAdjusted,
          totalAppraised,
          avgMarginAdj,
          avgMarginApp,
          totalCount: data.length,
          rankSummary,
          monthlySummary,
          marginLeaders,
          marginLaggards,
        },
        filters: { brand, type, rank },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
