'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

interface SalesData {
  id: string;
  sale_date: string;
  brand: string;
  type: string | null;
  rank: string | null;
  model_number: string | null;
  material: string | null;
  selling_price: number;
  adjusted_exp_sale_price: number | null;
  appraised_price: number | null;
  sale_quantity: number | null;
}

interface BrandSalesTableProps {
  brand: string;
}

export default function BrandSalesTable({ brand }: BrandSalesTableProps) {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await apiFetch(`/api/sales?brand=${encodeURIComponent(brand)}&limit=50`);
        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }
        const data = await response.json();
        setSales(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [brand]);

  if (loading) {
    return <div className="text-gray-500">販売データを読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">エラー: {error}</div>;
  }

  if (sales.length === 0) {
    return <div className="text-gray-500">販売データがありません</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium">最新の販売記録</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売日
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイプ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ランク
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                型番
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                素材
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                販売価格
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                調整価格
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                査定価格
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {new Date(sale.sale_date).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {sale.type || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    sale.rank === 'S' ? 'bg-purple-100 text-purple-800' :
                    sale.rank === 'A' ? 'bg-green-100 text-green-800' :
                    sale.rank === 'AB' ? 'bg-blue-100 text-blue-800' :
                    sale.rank === 'B' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {sale.rank || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {sale.model_number || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {sale.material || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  ¥{sale.selling_price.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {sale.adjusted_exp_sale_price
                    ? `¥${sale.adjusted_exp_sale_price.toLocaleString()}`
                    : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {sale.appraised_price
                    ? `¥${sale.appraised_price.toLocaleString()}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}