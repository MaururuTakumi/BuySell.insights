import Link from 'next/link';
import { fetchAccessibleBrands } from '@/lib/sales/brands';

export default async function BrandIndexPage() {
  // Supabaseから閲覧可能なブランド一覧を取得
  const brands = await fetchAccessibleBrands();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">ブランドビュー</h1>
        <p className="text-sm text-gray-600">
          担当ブランドのみ閲覧可能です。
        </p>
      </header>

      {brands.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-gray-600">閲覧可能なブランドがありません</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/brand/${encodeURIComponent(brand.slug)}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400"
              >
                <span>{brand.name}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
