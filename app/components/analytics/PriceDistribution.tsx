'use client';

import { BoxPlot, Scatter, Bar } from 'recharts';
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  ZAxis
} from 'recharts';

interface PriceDistributionProps {
  data: {
    priceDistribution: {
      median: number;
      q1: number;
      q3: number;
      min: number;
      max: number;
      outliers: Array<{
        id: string;
        price: number;
        type: string;
        date: string;
      }>;
    };
    categoryMetrics: Array<{
      category: string;
      count: number;
      avgPrice: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      medianPrice: number;
      avgPrice: number;
      count: number;
    }>;
  };
}

export default function PriceDistribution({ data }: PriceDistributionProps) {
  const formatPrice = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`;
    } else if (value >= 10000) {
      return `${Math.round(value / 10000)}万円`;
    }
    return `¥${value.toLocaleString()}`;
  };

  // 箱ひげ図のデータ準備
  const boxPlotData = [
    {
      name: '価格分布',
      min: data.priceDistribution.min,
      q1: data.priceDistribution.q1,
      median: data.priceDistribution.median,
      q3: data.priceDistribution.q3,
      max: data.priceDistribution.max,
    }
  ];

  // カテゴリ別価格分布
  const categoryData = data.categoryMetrics
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* 価格分布サマリー */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">価格分布統計</h3>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">最小値</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(data.priceDistribution.min)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">第1四分位</p>
            <p className="text-lg font-bold text-blue-600">{formatPrice(data.priceDistribution.q1)}</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">中央値</p>
            <p className="text-lg font-bold text-indigo-600">{formatPrice(data.priceDistribution.median)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">第3四分位</p>
            <p className="text-lg font-bold text-blue-600">{formatPrice(data.priceDistribution.q3)}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">最大値</p>
            <p className="text-lg font-bold text-gray-900">{formatPrice(data.priceDistribution.max)}</p>
          </div>
        </div>

        {/* 箱ひげ図表現（簡易版） */}
        <div className="relative h-12 bg-gray-100 rounded-lg">
          <div
            className="absolute top-1/2 -translate-y-1/2 h-px bg-gray-400"
            style={{
              left: '5%',
              right: '5%'
            }}
          />

          {/* ボックス部分 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-8 bg-blue-500 opacity-60 rounded"
            style={{
              left: `${((data.priceDistribution.q1 - data.priceDistribution.min) / (data.priceDistribution.max - data.priceDistribution.min)) * 90 + 5}%`,
              width: `${((data.priceDistribution.q3 - data.priceDistribution.q1) / (data.priceDistribution.max - data.priceDistribution.min)) * 90}%`
            }}
          />

          {/* 中央値の線 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-600"
            style={{
              left: `${((data.priceDistribution.median - data.priceDistribution.min) / (data.priceDistribution.max - data.priceDistribution.min)) * 90 + 5}%`
            }}
          />
        </div>

        {/* 外れ値 */}
        {data.priceDistribution.outliers.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              外れ値検出（{data.priceDistribution.outliers.length}件）
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.priceDistribution.outliers.slice(0, 4).map((outlier) => (
                <div key={outlier.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg text-sm">
                  <span className="text-gray-700">{outlier.type}</span>
                  <span className="font-bold text-orange-600">{formatPrice(outlier.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* カテゴリ別価格分布 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別平均価格</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatPrice}
            />
            <Tooltip
              formatter={(value: number) => formatPrice(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar
              dataKey="avgPrice"
              name="平均価格"
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index < 3 ? '#6366f1' : '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 月次価格トレンド */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">月次価格トレンド</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={formatPrice}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === '件数') return value;
                return formatPrice(value as number);
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="count"
              name="件数"
              fill="#e5e7eb"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="medianPrice"
              name="中央値"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}