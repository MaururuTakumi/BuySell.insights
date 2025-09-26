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
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filters</span>
        <button
          onClick={() => onFilterChange({})}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* タイプフィルター */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Material
          </label>
          <select
            value={filters.material || ''}
            onChange={(e) => handleFilterChange('material', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Rank
          </label>
          <select
            value={filters.rank || ''}
            onChange={(e) => handleFilterChange('rank', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            From
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        {/* 終了日 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            To
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
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