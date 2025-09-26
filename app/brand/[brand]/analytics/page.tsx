'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExecutiveSummary from '@/app/components/analytics/ExecutiveSummary';
import FilterPanel from '@/app/components/analytics/FilterPanel';
import PriceDistribution from '@/app/components/analytics/PriceDistribution';
import MaterialRankHeatmap from '@/app/components/analytics/MaterialRankHeatmap';
import { fromBrandSlug } from '@/lib/utils/brand-utils';

interface BrandAnalyticsPageProps {
  params: {
    brand: string;
  };
}

export default function BrandAnalyticsPage({ params }: BrandAnalyticsPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    brand: fromBrandSlug(params.brand).toUpperCase()
  });

  const [availableOptions, setAvailableOptions] = useState({
    types: [] as string[],
    materials: [] as string[],
    ranks: [] as string[]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/analytics?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);

      // 利用可能なオプションを抽出
      if (result) {
        const types = [...new Set(result.categoryMetrics.map((c: any) => c.category))];
        const materials = [...new Set(result.materialMetrics.map((m: any) => m.material))];
        const ranks = [...new Set(result.rankMetrics.map((r: any) => r.rank))];

        setAvailableOptions({
          types: types.filter(t => t !== 'その他'),
          materials: materials.filter(m => m !== 'その他'),
          ranks: ranks.filter(r => r !== 'N/A')
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({
      ...newFilters,
      brand: fromBrandSlug(params.brand).toUpperCase()
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">エラー: {error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">データがありません</p>
      </div>
    );
  }

  const displayName = fromBrandSlug(params.brand).toUpperCase();

  return (
    <main className="min-h-screen bg-gray-100">
      {/* シンプルなヘッダー */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-medium">
                {displayName} Analytics Dashboard
              </h1>
              <span className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/brand/${params.brand}`}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                ← Basic View
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* コンパクトなフィルター */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            availableOptions={availableOptions}
          />
        </div>

        {/* KPIサマリー */}
        <section>
          <ExecutiveSummary data={data} />
        </section>

        {/* 価格分布 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">価格分布・異常検知</h2>
          <PriceDistribution data={data} />
        </section>

        {/* 素材×ランクヒートマップ */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">素材×ランク分析</h2>
          <MaterialRankHeatmap data={data.materialRankMatrix} />
        </section>

        {/* 異常検知 */}
        {data.anomalies && data.anomalies.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">異常検知アラート</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-3">
                {data.anomalies.slice(0, 10).map((anomaly: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      anomaly.type === 'negative_profit' ? 'bg-red-50' :
                      anomaly.type === 'extreme_margin' ? 'bg-orange-50' :
                      'bg-yellow-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {anomaly.type === 'negative_profit' ? '🔴 損失取引' :
                         anomaly.type === 'extreme_margin' ? '⚠️ 極端な利益率' :
                         anomaly.type === 'over_limit_purchase' ? '💸 買取上限超過' :
                         '📊 価格異常'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{anomaly.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {anomaly.type === 'negative_profit' ? `-¥${anomaly.amount.toLocaleString()}` :
                         anomaly.type === 'extreme_margin' ? `${anomaly.amount.toFixed(1)}%` :
                         `¥${anomaly.amount.toLocaleString()}`}
                      </p>
                      <p className="text-xs text-gray-500">{anomaly.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}