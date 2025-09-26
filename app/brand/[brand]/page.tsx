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
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <Link href="/brand" className="text-sm text-blue-600 hover:underline">
              ← ブランド一覧へ戻る
            </Link>
            <Link
              href={`/brand/${params.brand}/analytics`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 新分析ダッシュボードを表示
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
