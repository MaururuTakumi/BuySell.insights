'use client';

interface MaterialRankHeatmapProps {
  data: Array<{
    material: string;
    rank: string;
    count: number;
    medianPrice: number;
    avgGrossProfitRate: number;
  }>;
}

export default function MaterialRankHeatmap({ data }: MaterialRankHeatmapProps) {
  // データを素材×ランクのマトリクスに変換
  const materials = [...new Set(data.map(d => d.material))].sort();
  const ranks = ['SA', 'S', 'A', 'AB', 'B', 'BC', 'C', 'N/A'];

  const matrixData: Record<string, Record<string, any>> = {};
  materials.forEach(material => {
    matrixData[material] = {};
    ranks.forEach(rank => {
      const item = data.find(d => d.material === material && d.rank === rank);
      matrixData[material][rank] = item || null;
    });
  });

  // 粗利率に基づく色の計算
  const getColor = (rate: number | null) => {
    if (rate === null) return '#f9fafb'; // gray-50
    if (rate < 20) return '#fef2f2'; // red-50
    if (rate < 40) return '#fef3c7'; // amber-50
    if (rate < 50) return '#fef9c3'; // yellow-50
    if (rate < 60) return '#dcfce7'; // green-100
    if (rate < 70) return '#bbf7d0'; // green-200
    return '#86efac'; // green-300
  };

  const getTextColor = (rate: number | null) => {
    if (rate === null) return '#9ca3af'; // gray-400
    if (rate < 40) return '#dc2626'; // red-600
    if (rate < 50) return '#d97706'; // amber-600
    return '#16a34a'; // green-600
  };

  const formatPrice = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`;
    } else if (value >= 10000) {
      return `${Math.round(value / 10000)}万円`;
    }
    return `¥${value.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">素材×ランク 粗利率ヒートマップ</h3>
        <p className="text-sm text-gray-500 mt-1">
          各セルは粗利率を表示（色が濃いほど高利益）
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50">
                素材 / ランク
              </th>
              {ranks.map(rank => (
                <th
                  key={rank}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-50"
                >
                  {rank}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map(material => (
              <tr key={material}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 whitespace-nowrap">
                  {material}
                </td>
                {ranks.map(rank => {
                  const cell = matrixData[material][rank];
                  return (
                    <td
                      key={rank}
                      className="px-2 py-2 text-center relative group cursor-pointer transition-all hover:shadow-lg"
                      style={{ backgroundColor: getColor(cell?.avgGrossProfitRate) }}
                    >
                      {cell ? (
                        <>
                          <div className="text-lg font-bold" style={{ color: getTextColor(cell.avgGrossProfitRate) }}>
                            {cell.avgGrossProfitRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {cell.count}件
                          </div>

                          {/* ホバー時の詳細情報 */}
                          <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3">
                              <div className="font-semibold mb-1">{material} / {rank}</div>
                              <div>件数: {cell.count}件</div>
                              <div>中央値: {formatPrice(cell.medianPrice)}</div>
                              <div>粗利率: {cell.avgGrossProfitRate.toFixed(1)}%</div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">粗利率:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-50 border border-gray-300"></div>
            <span>&lt;20%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-50 border border-gray-300"></div>
            <span>20-40%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-50 border border-gray-300"></div>
            <span>40-50%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-gray-300"></div>
            <span>50-60%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-gray-300"></div>
            <span>60-70%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-300 border border-gray-300"></div>
            <span>&gt;70%</span>
          </div>
        </div>
      </div>

      {/* インサイト */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            💎 高価値の組み合わせ
          </h4>
          <div className="space-y-1">
            {data
              .filter(d => d.avgGrossProfitRate > 60 && d.count > 2)
              .sort((a, b) => b.avgGrossProfitRate - a.avgGrossProfitRate)
              .slice(0, 3)
              .map((item, idx) => (
                <div key={idx} className="text-xs text-green-700">
                  {item.material} × {item.rank}: {item.avgGrossProfitRate.toFixed(1)}%
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ 注意が必要な組み合わせ
          </h4>
          <div className="space-y-1">
            {data
              .filter(d => d.avgGrossProfitRate < 40 && d.count > 2)
              .sort((a, b) => a.avgGrossProfitRate - b.avgGrossProfitRate)
              .slice(0, 3)
              .map((item, idx) => (
                <div key={idx} className="text-xs text-red-700">
                  {item.material} × {item.rank}: {item.avgGrossProfitRate.toFixed(1)}%
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}