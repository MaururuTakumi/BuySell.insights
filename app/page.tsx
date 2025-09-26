import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">BUYSELL Dashboard MVP</h1>
        <p className="text-sm text-gray-600">
          CSV 取り込みとブランド別ダッシュボードを提供する社内向けアプリケーションです。
        </p>
      </header>
      <section className="space-y-4">
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-medium">ダッシュボードへ移動</h2>
          <p className="mt-2 text-sm text-gray-600">
            ブランド横断ビューや CSV アップロードなどの主要機能にアクセスします。
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex w-fit items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            ダッシュボードを見る
          </Link>
        </div>
      </section>
    </main>
  );
}
