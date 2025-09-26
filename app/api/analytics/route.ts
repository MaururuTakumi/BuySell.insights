import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';

interface MetricsData {
  // 基本指標
  gmv: number; // 総売上高（数量加重）
  totalGrossProfit: number; // 総粗利額（数量加重）
  grossMarginPct: number; // 粗利率（売上加重）
  negotiationEfficiency: number; // 交渉効率（不正行除外）
  totalCount: number;
  totalQuantity: number; // 総販売数量

  // データ品質カウンタ
  dataQuality: {
    cntAppraisedGtAdjusted: number; // appraised > adjusted の件数
    cntSellingLtAppraised: number; // selling < appraised の件数（赤字）
    cntAdjustedNullOrZero: number; // adjusted がnullまたは0の件数
    excludedFromNegotiation: number; // 交渉効率計算から除外された件数
  };

  // 価格分布統計
  priceDistribution: {
    median: number;
    q1: number; // 第1四分位
    q3: number; // 第3四分位
    min: number;
    max: number;
    outliers: Array<{
      id: string;
      price: number;
      type: string;
      date: string;
    }>;
  };

  // カテゴリ別分析
  categoryMetrics: Array<{
    category: string;
    count: number;
    avgPrice: number;
    avgGrossProfit: number;
    avgGrossProfitRate: number;
  }>;

  // 素材別分析
  materialMetrics: Array<{
    material: string;
    count: number;
    avgPrice: number;
    avgGrossProfit: number;
    medianPrice: number;
  }>;

  // ランク別分析
  rankMetrics: Array<{
    rank: string;
    count: number;
    avgPrice: number;
    avgGrossProfit: number;
    avgNegotiationRoom: number;
  }>;

  // 素材×ランクのマトリクス
  materialRankMatrix: Array<{
    material: string;
    rank: string;
    count: number;
    medianPrice: number;
    avgGrossProfitRate: number;
  }>;

  // トップ/ワースト商品
  topProducts: Array<{
    id: string;
    model_number: string;
    type: string;
    material: string;
    grossProfitRate: number;
    sellingPrice: number;
    saleDate: string;
  }>;

  worstProducts: Array<{
    id: string;
    model_number: string;
    type: string;
    material: string;
    grossProfitRate: number;
    sellingPrice: number;
    saleDate: string;
  }>;

  // 月次トレンド
  monthlyTrends: Array<{
    month: string;
    count: number;
    gmv: number;
    avgPrice: number;
    medianPrice: number;
    avgGrossProfitRate: number;
  }>;

  // 異常検知
  anomalies: Array<{
    id: string;
    type: 'negative_profit' | 'extreme_margin' | 'over_limit_purchase' | 'price_outlier';
    description: string;
    amount: number;
    date: string;
  }>;

  // 後方互換性のための旧フィールド（非推奨）
  avgGrossProfitRate?: number; // grossMarginPct を使用してください
  avgNegotiationEfficiency?: number; // negotiationEfficiency を使用してください
}

function calculatePercentiles(values: number[]): { q1: number; median: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q1Index = Math.floor(n * 0.25);
  const medianIndex = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  return {
    q1: sorted[q1Index] || 0,
    median: sorted[medianIndex] || 0,
    q3: sorted[q3Index] || 0
  };
}

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const { searchParams } = new URL(request.url);

  const brand = searchParams.get('brand');
  const type = searchParams.get('type');
  const material = searchParams.get('material');
  const rank = searchParams.get('rank');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    // ベースクエリ構築
    let query = supabase.from('sales').select('*');

    // フィルター適用
    if (brand) query = query.eq('brand', brand.toUpperCase());
    if (type) query = query.eq('type', type);
    if (material) query = query.ilike('material', `%${material}%`);
    if (rank) query = query.eq('rank', rank);
    if (startDate) query = query.gte('sale_date', startDate);
    if (endDate) query = query.lte('sale_date', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analytics data:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: 'No data found',
        filters: { brand, type, material, rank, startDate, endDate }
      }, { status: 404 });
    }

    // 基本指標の計算（数量加重）
    const gmv = data.reduce((sum, row) => {
      const quantity = row.sale_quantity || 1;
      return sum + (row.selling_price * quantity);
    }, 0);

    // 総販売数量
    const totalQuantity = data.reduce((sum, row) => {
      return sum + (row.sale_quantity || 1);
    }, 0);

    // 粗利計算（数量加重）
    const profitRows = data.filter(row => row.appraised_price != null && row.appraised_price > 0);
    const totalGrossProfit = profitRows.reduce((sum, row) => {
      const quantity = row.sale_quantity || 1;
      return sum + ((row.selling_price - row.appraised_price!) * quantity);
    }, 0);

    // 粗利率（売上加重）
    const totalRevenue = profitRows.reduce((sum, row) => {
      const quantity = row.sale_quantity || 1;
      return sum + (row.selling_price * quantity);
    }, 0);

    const grossMarginPct = totalRevenue > 0
      ? (totalGrossProfit / totalRevenue) * 100
      : 0;

    // 交渉効率計算（不正行除外）
    const validNegotiationRows = data.filter(row =>
      row.adjusted_exp_sale_price != null &&
      row.appraised_price != null &&
      row.adjusted_exp_sale_price > 0 &&
      row.appraised_price <= row.adjusted_exp_sale_price // 上限割れを除外
    );

    const negotiationEfficiency = validNegotiationRows.length > 0
      ? validNegotiationRows.reduce((sum, row) => {
          const efficiency = 1 - (row.appraised_price! / row.adjusted_exp_sale_price!);
          return sum + efficiency;
        }, 0) / validNegotiationRows.length * 100
      : 0;

    // データ品質カウンタ
    const cntAppraisedGtAdjusted = data.filter(row =>
      row.adjusted_exp_sale_price != null &&
      row.appraised_price != null &&
      row.appraised_price > row.adjusted_exp_sale_price
    ).length;

    const cntSellingLtAppraised = data.filter(row =>
      row.appraised_price != null &&
      row.selling_price < row.appraised_price
    ).length;

    const cntAdjustedNullOrZero = data.filter(row =>
      row.adjusted_exp_sale_price == null ||
      row.adjusted_exp_sale_price === 0
    ).length;

    const excludedFromNegotiation = data.filter(row =>
      row.adjusted_exp_sale_price != null &&
      row.appraised_price != null &&
      row.adjusted_exp_sale_price > 0
    ).length - validNegotiationRows.length;

    // 価格分布（Tukey法による外れ値検出、n>=5のときのみ）
    const prices = data.map(row => row.selling_price);
    const percentiles = calculatePercentiles(prices);
    const iqr = percentiles.q3 - percentiles.q1;
    const lowerBound = percentiles.q1 - 1.5 * iqr;
    const upperBound = percentiles.q3 + 1.5 * iqr;

    const outliers = data.length >= 5
      ? data
          .filter(row => row.selling_price < lowerBound || row.selling_price > upperBound)
          .map(row => ({
            id: row.id,
            price: row.selling_price,
            type: row.type || 'N/A',
            date: row.sale_date
          }))
          .slice(0, 10)
      : [];

    // カテゴリ（タイプ）別メトリクス
    const categoryMap: Record<string, any[]> = {};
    data.forEach(row => {
      const cat = row.type || 'その他';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(row);
    });

    const categoryMetrics = Object.entries(categoryMap).map(([category, rows]) => {
      const validRows = rows.filter(r => r.appraised_price != null);
      const avgGrossProfit = validRows.length > 0
        ? validRows.reduce((sum, r) => sum + (r.selling_price - r.appraised_price), 0) / validRows.length
        : 0;

      const avgGrossProfitRate = validRows.length > 0
        ? validRows.reduce((sum, r) => sum + ((r.selling_price - r.appraised_price) / r.selling_price * 100), 0) / validRows.length
        : 0;

      return {
        category,
        count: rows.length,
        avgPrice: rows.reduce((sum, r) => sum + r.selling_price, 0) / rows.length,
        avgGrossProfit,
        avgGrossProfitRate
      };
    }).sort((a, b) => b.avgGrossProfitRate - a.avgGrossProfitRate);

    // 素材別メトリクス
    const materialMap: Record<string, any[]> = {};
    data.forEach(row => {
      const mat = row.material || 'その他';
      if (!materialMap[mat]) materialMap[mat] = [];
      materialMap[mat].push(row);
    });

    const materialMetrics = Object.entries(materialMap).map(([material, rows]) => {
      const validRows = rows.filter(r => r.appraised_price != null);
      const prices = rows.map(r => r.selling_price);
      const medianPrice = calculatePercentiles(prices).median;

      const avgGrossProfit = validRows.length > 0
        ? validRows.reduce((sum, r) => sum + (r.selling_price - r.appraised_price), 0) / validRows.length
        : 0;

      return {
        material,
        count: rows.length,
        avgPrice: rows.reduce((sum, r) => sum + r.selling_price, 0) / rows.length,
        avgGrossProfit,
        medianPrice
      };
    }).sort((a, b) => b.count - a.count);

    // ランク別メトリクス
    const rankMap: Record<string, any[]> = {};
    data.forEach(row => {
      const r = row.rank || 'N/A';
      if (!rankMap[r]) rankMap[r] = [];
      rankMap[r].push(row);
    });

    const rankOrder = ['SA', 'S', 'A', 'AB', 'B', 'BC', 'C', 'N/A'];
    const rankMetrics = Object.entries(rankMap)
      .map(([rank, rows]) => {
        const validRows = rows.filter(r => r.appraised_price != null);
        const negotiationRows = rows.filter(r =>
          r.adjusted_exp_sale_price != null && r.appraised_price != null
        );

        const avgGrossProfit = validRows.length > 0
          ? validRows.reduce((sum, r) => sum + (r.selling_price - r.appraised_price), 0) / validRows.length
          : 0;

        const avgNegotiationRoom = negotiationRows.length > 0
          ? negotiationRows.reduce((sum, r) => sum + (r.adjusted_exp_sale_price - r.appraised_price), 0) / negotiationRows.length
          : 0;

        return {
          rank,
          count: rows.length,
          avgPrice: rows.reduce((sum, r) => sum + r.selling_price, 0) / rows.length,
          avgGrossProfit,
          avgNegotiationRoom
        };
      })
      .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

    // 素材×ランクマトリクス
    const matrixMap: Record<string, any[]> = {};
    data.forEach(row => {
      const key = `${row.material || 'その他'}|${row.rank || 'N/A'}`;
      if (!matrixMap[key]) matrixMap[key] = [];
      matrixMap[key].push(row);
    });

    const materialRankMatrix = Object.entries(matrixMap).map(([key, rows]) => {
      const [material, rank] = key.split('|');
      const prices = rows.map(r => r.selling_price);
      const medianPrice = calculatePercentiles(prices).median;

      const validRows = rows.filter(r => r.appraised_price != null);
      const avgGrossProfitRate = validRows.length > 0
        ? validRows.reduce((sum, r) => sum + ((r.selling_price - r.appraised_price) / r.selling_price * 100), 0) / validRows.length
        : 0;

      return {
        material,
        rank,
        count: rows.length,
        medianPrice,
        avgGrossProfitRate
      };
    });

    // トップ/ワースト商品（粗利率ベース）
    const productsWithProfit = data
      .filter(row => row.appraised_price != null && row.appraised_price > 0)
      .map(row => ({
        id: row.id,
        model_number: row.model_number || 'N/A',
        type: row.type || 'N/A',
        material: row.material || 'N/A',
        grossProfitRate: ((row.selling_price - row.appraised_price!) / row.selling_price * 100),
        sellingPrice: row.selling_price,
        saleDate: row.sale_date
      }))
      .sort((a, b) => b.grossProfitRate - a.grossProfitRate);

    const topProducts = productsWithProfit.slice(0, 10);
    const worstProducts = productsWithProfit.slice(-10).reverse();

    // 月次トレンド
    const monthlyMap: Record<string, any[]> = {};
    data.forEach(row => {
      const month = row.year_month || row.sale_date.substring(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = [];
      monthlyMap[month].push(row);
    });

    const monthlyTrends = Object.entries(monthlyMap)
      .map(([month, rows]) => {
        const prices = rows.map(r => r.selling_price);
        const medianPrice = calculatePercentiles(prices).median;

        const validRows = rows.filter(r => r.appraised_price != null);
        const avgGrossProfitRate = validRows.length > 0
          ? validRows.reduce((sum, r) => sum + ((r.selling_price - r.appraised_price) / r.selling_price * 100), 0) / validRows.length
          : 0;

        return {
          month,
          count: rows.length,
          gmv: rows.reduce((sum, r) => sum + r.selling_price, 0),
          avgPrice: rows.reduce((sum, r) => sum + r.selling_price, 0) / rows.length,
          medianPrice,
          avgGrossProfitRate
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // 異常検知
    const anomalies: Array<{
      id: string;
      type: 'negative_profit' | 'extreme_margin' | 'over_limit_purchase';
      description: string;
      amount: number;
      date: string;
    }> = [];

    // 負の粗利（selling_price < appraised_price）
    data.forEach(row => {
      if (row.appraised_price && row.selling_price < row.appraised_price) {
        anomalies.push({
          id: row.id,
          type: 'negative_profit' as const,
          description: `Loss sale: Sold for ¥${row.selling_price.toLocaleString()} but acquired for ¥${row.appraised_price.toLocaleString()}`,
          amount: row.appraised_price - row.selling_price,
          date: row.sale_date
        });
      }

      // 極端な粗利率（90%以上）
      if (row.appraised_price) {
        const profitRate = (row.selling_price - row.appraised_price) / row.selling_price * 100;
        if (profitRate > 90) {
          anomalies.push({
            id: row.id,
            type: 'extreme_margin' as const,
            description: `Extreme margin: ${profitRate.toFixed(1)}% profit rate`,
            amount: profitRate,
            date: row.sale_date
          });
        }
      }

      // 買取上限を超える買取価格（appraised_price > adjusted_exp_sale_price）
      if (row.adjusted_exp_sale_price && row.appraised_price && row.appraised_price > row.adjusted_exp_sale_price) {
        anomalies.push({
          id: row.id,
          type: 'over_limit_purchase' as const,
          description: `Over-limit purchase: Acquired for ¥${row.appraised_price.toLocaleString()} exceeding limit ¥${row.adjusted_exp_sale_price.toLocaleString()}`,
          amount: row.appraised_price - row.adjusted_exp_sale_price,
          date: row.sale_date
        });
      }
    });

    const response: MetricsData = {
      gmv,
      totalGrossProfit,
      grossMarginPct,
      negotiationEfficiency,
      totalCount: data.length,
      totalQuantity,
      dataQuality: {
        cntAppraisedGtAdjusted,
        cntSellingLtAppraised,
        cntAdjustedNullOrZero,
        excludedFromNegotiation
      },
      priceDistribution: {
        median: percentiles.median,
        q1: percentiles.q1,
        q3: percentiles.q3,
        min: Math.min(...prices),
        max: Math.max(...prices),
        outliers
      },
      categoryMetrics,
      materialMetrics,
      rankMetrics,
      materialRankMatrix,
      topProducts,
      worstProducts,
      monthlyTrends,
      anomalies: anomalies.slice(0, 20),
      // 後方互換性のための旧フィールド（非推奨）
      avgGrossProfitRate: grossMarginPct,
      avgNegotiationEfficiency: negotiationEfficiency
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}