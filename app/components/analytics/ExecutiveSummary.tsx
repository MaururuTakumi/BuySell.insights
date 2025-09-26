'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';

interface ExecutiveSummaryProps {
  data: {
    gmv: number;
    totalGrossProfit: number;
    grossMarginPct?: number; // 新しいフィールド
    avgGrossProfitRate?: number; // 後方互換性
    negotiationEfficiency?: number; // 新しいフィールド
    avgNegotiationEfficiency?: number; // 後方互換性
    totalCount: number;
    totalQuantity?: number;
    dataQuality?: {
      cntAppraisedGtAdjusted: number;
      cntSellingLtAppraised: number;
      cntAdjustedNullOrZero: number;
      excludedFromNegotiation: number;
    };
    topProducts: Array<{
      model_number: string;
      type: string;
      material: string;
      grossProfitRate: number;
    }>;
    worstProducts: Array<{
      model_number: string;
      type: string;
      material: string;
      grossProfitRate: number;
    }>;
  };
}

export default function ExecutiveSummary({ data }: ExecutiveSummaryProps) {
  const formatCurrency = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`;
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}万円`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* メイン指標カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-500">総売上高 (GMV)</p>
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    GMV = Σ(selling_price × sale_quantity)
                    <br />販売価格と販売数量の積の総和
                  </div>
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(data.gmv)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{data.totalCount} 件</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-500">総粗利額</p>
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    粗利額 = Σ((selling_price - appraised_price) × sale_quantity)
                    <br />各取引の粗利益と数量の積の総和
                  </div>
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(data.totalGrossProfit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                売上の {((data.totalGrossProfit / data.gmv) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-500">粗利率（売上加重）</p>
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    粗利率 = Σ(selling_price - appraised_price) ÷ Σ(selling_price) × 100
                    <br />売上加重平均による粗利益率
                  </div>
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {(data.grossMarginPct ?? data.avgGrossProfitRate ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                業界基準: 45-55%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              (data.grossMarginPct ?? data.avgGrossProfitRate ?? 0) >= 50 ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <svg className={`w-6 h-6 ${
                (data.grossMarginPct ?? data.avgGrossProfitRate ?? 0) >= 50 ? 'text-green-600' : 'text-yellow-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative group">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-medium text-gray-500">交渉効率</p>
                <div className="relative">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    交渉効率 = AVG((adjusted - appraised) ÷ adjusted × 100)
                    <br />買取上限からの削減率の平均
                    <br />※不正行除外: appraised ≤ adjusted && adjusted > 0
                  </div>
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {(data.negotiationEfficiency ?? data.avgNegotiationEfficiency ?? 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                提示上限からの削減率
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              (data.negotiationEfficiency ?? data.avgNegotiationEfficiency ?? 0) <= 30 ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <svg className={`w-6 h-6 ${
                (data.negotiationEfficiency ?? data.avgNegotiationEfficiency ?? 0) <= 30 ? 'text-green-600' : 'text-orange-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* データ品質アラート */}
      {data.dataQuality && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-900">データ品質チェック</h3>
              <div className="mt-2 text-sm text-amber-700 space-y-1">
                {data.dataQuality.cntSellingLtAppraised > 0 && (
                  <p>• 赤字取引: {data.dataQuality.cntSellingLtAppraised}件（販売価格 &lt; 買取価格）</p>
                )}
                {data.dataQuality.cntAppraisedGtAdjusted > 0 && (
                  <p>• 買取上限超過: {data.dataQuality.cntAppraisedGtAdjusted}件（買取価格 &gt; 上限価格）</p>
                )}
                {data.dataQuality.cntAdjustedNullOrZero > 0 && (
                  <p>• 上限価格欠損: {data.dataQuality.cntAdjustedNullOrZero}件（交渉効率計算から除外）</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トップ&ワースト商品 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* トップ商品 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">高利益率商品 TOP 3</h3>
            <ArrowUpIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-3">
            {data.topProducts.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {product.type} / {product.material}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.model_number !== 'N/A' ? product.model_number : '型番なし'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {product.grossProfitRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">粗利率</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ワースト商品 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">低利益率商品 WORST 3</h3>
            <ArrowDownIcon className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-3">
            {data.worstProducts.slice(0, 3).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {product.type} / {product.material}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.model_number !== 'N/A' ? product.model_number : '型番なし'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {product.grossProfitRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">粗利率</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}