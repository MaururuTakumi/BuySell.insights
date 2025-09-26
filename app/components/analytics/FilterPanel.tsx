'use client';

interface FilterPanelProps {
  filters: {
    brand?: string;
    type?: string;
    material?: string;
    rank?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (filters: any) => void;
  availableOptions: {
    types: string[];
    materials: string[];
    ranks: string[];
  };
}

export default function FilterPanel({ filters, onFilterChange, availableOptions }: FilterPanelProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">フィルター</h3>
        <button
          onClick={() => onFilterChange({})}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          リセット
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* タイプフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タイプ
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">すべて</option>
            {availableOptions.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* 素材フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            素材
          </label>
          <select
            value={filters.material || ''}
            onChange={(e) => handleFilterChange('material', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">すべて</option>
            {availableOptions.materials.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>

        {/* ランクフィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ランク
          </label>
          <select
            value={filters.rank || ''}
            onChange={(e) => handleFilterChange('rank', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">すべて</option>
            {availableOptions.ranks.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
        </div>

        {/* 開始日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始日
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 終了日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            終了日
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 適用ボタン */}
        <div className="flex items-end">
          <button
            onClick={() => onFilterChange(filters)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            適用
          </button>
        </div>
      </div>
    </div>
  );
}