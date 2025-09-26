import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">ダッシュボード概要</h1>
          <Link
            href="/brand" // TODO: replace with brand picker once auth is implemented
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ブランド一覧を見る
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          集計値・散布図・テーブルを通じてブランド別の販売状況を把握します。
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {/* TODO: SummaryCards component to display totals/margins */}
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 shadow-sm">
          Summary cards placeholder
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 shadow-sm">
          Filters placeholder
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 shadow-sm">
          Upload form placeholder
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Scatter chart placeholder {/* TODO: Render Recharts/Nivo scatter plot */}
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Rank table placeholder {/* TODO: Render RankTable component */}
        </div>
      </section>
      <section className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
        Monthly table placeholder {/* TODO: Render MonthlyTable component */}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Margin leaders placeholder {/* TODO: Render top margin list */}
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Margin laggards placeholder {/* TODO: Render bottom margin list */}
        </div>
      </section>
    </main>
  );
}
