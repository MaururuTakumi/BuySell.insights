import Link from 'next/link';
import BrandGate from '@/app/dashboard/BrandGate';
import BrandMetrics from '@/app/components/BrandMetrics';
import BrandSalesTable from '@/app/components/BrandSalesTable';
import { fromBrandSlug } from '@/lib/utils/brand-utils';

interface BrandPageProps {
  params: {
    brand: string;
  };
}

export default function BrandDetailPage({ params }: BrandPageProps) {
  // fromBrandSlugを使用して統一された表示名を取得
  const displayName = fromBrandSlug(params.brand).toUpperCase();

  return (
    <BrandGate brand={params.brand}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-12">
        {/* 新ダッシュボードへの目立つナビゲーション */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-semibold text-blue-900">データ分析ダッシュボード</span>
              </div>
              <p className="text-xs text-blue-700">
                KPI計算、データ品質モニタリング、素材×ランク分析、異常検知などの高度な分析機能
              </p>
            </div>
            <Link
              href={`/brand/${params.brand}/analytics`}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              ダッシュボードを見る
            </Link>
          </div>
        </div>

        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <Link href="/brand" className="text-sm text-gray-600 hover:text-gray-900">
              ← ブランド一覧へ戻る
            </Link>
          </div>
          <h1 className="text-3xl font-semibold">{displayName} ブランド分析</h1>
          <p className="text-sm text-gray-600">
            ブランド担当者向けビューです。認証済みユーザーのブランド権限を確認し、該当データのみを表示します。
          </p>
        </header>

        {/* メトリクスコンポーネント */}
        <BrandMetrics brand={displayName} />

        {/* 販売データテーブル */}
        <BrandSalesTable brand={displayName} />
      </main>
    </BrandGate>
  );
}
