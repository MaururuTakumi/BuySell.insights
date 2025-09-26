'use client';

import { useEffect, useState } from 'react';

interface MetricsData {
  totalSelling: number;
  totalAdjusted: number;
  totalAppraised: number;
  avgMarginAdj: number;
  avgMarginApp: number;
  totalCount: number;
  rankSummary: Array<{
    rank: string;
    count: number;
    totalSelling: number;
    avgSelling: number;
  }>;
  monthlySummary: Array<{
    month: string;
    count: number;
    totalSelling: number;
    avgSelling: number;
  }>;
}

interface BrandMetricsProps {
  brand: string;
}

export default function BrandMetrics({ brand }: BrandMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/metrics?brand=${encodeURIComponent(brand)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        const data = await response.json();
        setMetrics(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [brand]);

  if (loading) {
    return <div className="text-gray-500">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">エラー: {error}</div>;
  }

  if (!metrics) {
    return <div className="text-gray-500">データがありません</div>;
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">総売上</h3>
          <p className="mt-2 text-2xl font-semibold">¥{metrics.totalSelling.toLocaleString()}</p>
          <p className="text-sm text-gray-400">件数: {metrics.totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">平均調整マージン</h3>
          <p className="mt-2 text-2xl font-semibold">{metrics.avgMarginAdj.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">平均査定マージン</h3>
          <p className="mt-2 text-2xl font-semibold">{metrics.avgMarginApp.toFixed(1)}%</p>
        </div>
      </div>

      {/* ランク別集計 */}
      {metrics.rankSummary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">ランク別売上</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ランク</th>
                  <th className="text-right py-2">件数</th>
                  <th className="text-right py-2">総売上</th>
                  <th className="text-right py-2">平均売上</th>
                </tr>
              </thead>
              <tbody>
                {metrics.rankSummary.map((rank) => (
                  <tr key={rank.rank} className="border-b">
                    <td className="py-2">{rank.rank}</td>
                    <td className="text-right py-2">{rank.count}</td>
                    <td className="text-right py-2">¥{rank.totalSelling.toLocaleString()}</td>
                    <td className="text-right py-2">¥{Math.round(rank.avgSelling).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 月別集計 */}
      {metrics.monthlySummary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">月別売上推移</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">年月</th>
                  <th className="text-right py-2">件数</th>
                  <th className="text-right py-2">総売上</th>
                  <th className="text-right py-2">平均売上</th>
                </tr>
              </thead>
              <tbody>
                {metrics.monthlySummary.map((month) => (
                  <tr key={month.month} className="border-b">
                    <td className="py-2">{month.month}</td>
                    <td className="text-right py-2">{month.count}</td>
                    <td className="text-right py-2">¥{month.totalSelling.toLocaleString()}</td>
                    <td className="text-right py-2">¥{Math.round(month.avgSelling).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}