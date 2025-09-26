# BUYSELL Dashboard Next.js 技術実装ガイド（MVP）

本書は Next.js (App Router) を用いて CSV 取り込み〜Supabase upsert〜ブランド限定ダッシュボードを構築する際の技術的ベストプラクティスをまとめたものです。CLI Codex が迷わず実装できるよう、フォルダ構成・ライブラリ選定・コーディング規約・テスト方針までを網羅します。

---

## 1. 実装原則

- **App Router + TypeScript**：Next.js 13+ の `app/` ディレクトリを採用し、React Server Components (RSC) を活用してデータ取得をサーバ側で行う。
- **Strict モード / ESLint / Prettier** を標準有効化。ビルド時に型エラーをブロックする。
- **セキュア by default**：環境変数は `.env.local` に限定、ランタイム共有は `NEXT_PUBLIC_` プレフィックスのみ。Supabase サービスキーはサーバ内に限定。
- **DX 重視**：CLI ベースでの開発を想定し、npm scripts で lint/test/build を一貫化。
- **Idempotent + Observable**：CSV 取り込みは冪等性とログ可視化を最優先。例外は明示的にハンドリング。

---

## 2. システム構成

```
[Browser]
  |--CSV Upload/ダッシュボード閲覧---------------
[Next.js (App Router)]
  |--Server Actions / Route Handlers
  |--Supabase Client (Service Role)
  |--tRPC/REST (任意)
[Supabase]
  |--PostgreSQL + RLS
  |--Auth (Email+OTP または SSO)
```

- Vercel or Supabase Edge Functions でのホスティングを想定。プライベート案件なら Vercel + Supabase が最も簡易。
- Supabase Auth を採用し、JWT クレームに担当ブランドを含めて RLS と連携。

---

## 3. ディレクトリ構成（推奨）

```
app/
  layout.tsx
  page.tsx
  dashboard/
    page.tsx
    BrandGate.tsx
    SummaryCards.tsx
    ScatterChart.tsx
    Tables/
      RankTable.tsx
      MonthlyTable.tsx
      MarginLeaders.tsx
  brand/
    [brand]/page.tsx
  api/
    ingest/route.ts
    sales/route.ts
    metrics/route.ts
lib/
  supabase/
    client.ts
    server.ts
  csv/
    parser.ts
    schema.ts
    hash.ts
  auth/
    middleware.ts
    rls.ts
components/
  UploadForm.tsx
  Alert.tsx
  DataTable.tsx
  Filters.tsx
hooks/
  useSalesData.ts
  useMetrics.ts
styles/
  globals.css
  dashboard.css
config/
  env.ts
  constants.ts
scripts/
  seed.ts
  lint-staged.config.mjs
```

---

## 4. 主要ライブラリ

| 分類 | ライブラリ | 理由 |
| ---- | ---------- | ---- |
| CSV パース | `fast-csv` or `csv-parse` | ストリーミング対応で大規模 CSV も捌ける |
| 型/バリデーション | `zod` | CSV 行・API リクエストのバリデーション |
| グラフ | `recharts` + `@nivo` いずれか | React + SSR 対応の可視化ライブラリ |
| ステート | `@tanstack/react-query` | キャッシングとリフェッチを統一 |
| UI | `shadcn/ui` (Tailwind) | MVP でも統一感ある UI を短時間で構築 |
| Supabase | `@supabase/supabase-js` v2 | Auth/RLS と連携 |
| テスト | `jest` + `@testing-library/react` + `vitest` (任意) | ユニット/コンポーネントテスト |
| E2E | `playwright` | CSV アップロードやフィルタ遷移の自動試験 |

---

## 5. CSV 取り込みパイプライン

1. **UI**：`UploadForm.tsx` で `<input type="file" accept=".csv" />`。`FormData` で `/api/ingest` に送信。
2. **Route Handler (`app/api/ingest/route.ts`)**：
   - 認証チェック（Service Role が必要なためサーバトークン必須）。
   - アップロードファイルを一時ストレージに保存せず、ストリームで処理。
   - `zod` スキーマ `SalesCsvRowSchema` による行バリデーション。
   - `row_hash` を生成し、`supabase.from('sales').upsert()` をバッチ（200〜500 行）に分けて実行。
   - 成功件数/更新件数を集計して JSON レスポンス。
   - エラー行は `failed_rows` に格納し、レスポンスと監査ログに含める。
3. **監査ログ**：`lib/csv/parser.ts` で統計を収集し、`ingest_logs` テーブルへ非同期挿入（将来の後続）。
4. **冪等性検証**：`row_hash` の衝突テストを Jest で実装。

---

## 6. 認証とRLS戦略

- **Auth**：Supabase Auth の Email OTP または社内 SSO。ログイン後にユーザプロフィール `user_roles` (`user_id`, `brand_codes[]`) を保持。
- **JWT カスタムクレーム**：`Supabase Auth > JWT_SECRET` を設定し、`user_roles.brand_codes` を `jwt` に注入。
- **RLS ポリシー（例）**：

```sql
create policy "brand scoped select" on sales
for select using (
  auth.role() = 'service_role'
  or sales.brand = any (current_setting('request.jwt.claims'::text)::json->>'brand_codes')
);
```

- Next.js では `lib/supabase/server.ts` でサーバサイド Supabase クライアントを初期化し、`cookies()` からセッショントークンを取得。クライアント側は `createBrowserClient` を利用。
- 管理者（CSV 書込み）はサービスロールを用いた `Route Handler` のみ許可し、ブラウザからは公開しない。

---

## 7. ダッシュボード実装方針

- **ページ設計**：
  - `/dashboard`：ブランド横断のカード/グラフ/テーブル。RSC でサーバフェッチ → Suspense でクライアント表示。
  - `/brand/[brand]`：BrandGate で `brand` が担当ブランドに含まれるか検証。
- **データ取得**：
  - `getSalesData(filters)` をサーバディレクトリ `app/dashboard/data.ts` にまとめ、`cache()` でメモ化。
  - クライアント側は `useSalesData` で React Query を使用し、フィルタ変更時にリフェッチ。
- **チャート**：SSR 対応のため `dynamic(() => import('recharts'), { ssr: false })` を利用。初回レンダリングは Skeleton を表示。
- **アクセシビリティ**：ARIA 属性、キーボード操作対応を lint (`eslint-plugin-jsx-a11y`) で担保。

---

## 8. API 設計

| Method | Path | 用途 | 留意点 |
| ------ | ---- | ---- | ------ |
| POST | `/api/ingest` | CSV 取り込み | サービスロールのみ。`multipart/form-data`。500 行ごとにコミット。 |
| GET | `/api/sales` | ダッシュボード一覧用データ | Query パラメータで brand/type/rank/from/to。RLS でブランド制限。 |
| GET | `/api/metrics` | サマリー/集計 | MVP ではクライアント集計でも可。将来サーバ集計へ移行しやすい構造を維持。 |

`route.ts` では `NextResponse.json()` に統一し、Zod で入力検証。OpenAPI (Swagger) を `openapi.yaml` として `docs/` に出力しておくと将来の統合が容易。

---

## 9. Supabase スキーマ

```sql
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  sale_date date not null,
  sales_channel text,
  sale_contact text,
  item_type_group text,
  brand text not null,
  rank text,
  type text,
  model_number text,
  material text,
  sale_quantity integer default 1,
  adjusted_exp_sale_price integer default 0,
  appraised_price integer default 0,
  selling_price integer not null,
  year_month text generated always as (to_char(sale_date, 'YYYY/MM')) stored,
  margin_adj integer generated always as (selling_price - adjusted_exp_sale_price) stored,
  margin_app integer generated always as (selling_price - appraised_price) stored,
  row_hash text not null,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index on sales (row_hash);
create index on sales (sale_date);
create index on sales (brand);
create index on sales (rank);
create index on sales (type);
create index on sales (year_month);

create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on sales
for each row execute procedure trigger_set_timestamp();
```

RLS ポリシーは前述の brand 制限に加え、サービスロール用の `insert/update/delete` ポリシーを設定。

---

## 10. フロントエンド品質基準

- コンポーネントは **Atomic Design** ではなく、機能ごとにまとまる Feature-first 構造を採用。
- Hooks で API アクセスをカプセル化。React Query の `queryKey` にブランド/フィルタを明示。
- Suspense + Error Boundary を活用。`LoadingSkeleton` と `ErrorFallback` コンポーネントを共通化。
- 数値フォーマットは `Intl.NumberFormat('ja-JP')`。日付は `dayjs` もしくは `date-fns-tz` を用いる。
- ブラウザ互換性：Chrome/Edge/Safari/Firefox 最新。Tailwind/デザインはダークモード非対応でも可。

---

## 11. テスト戦略

| レイヤー | 内容 | ツール |
| -------- | ---- | ---- |
| ユニット | CSV パース、`row_hash` 生成、`zod` スキーマ | Vitest or Jest |
| API | `/api/ingest` の成功/失敗パス、RLS 付きでのアクセス権テスト | `supertest`, `msw` |
| コンポーネント | ダッシュボード各カード、フィルタ連動 | `@testing-library/react` |
| E2E | CSV アップロード→ダッシュボード反映→ブランド制限確認 | Playwright |

CI（GitHub Actions）で `lint`, `type-check`, `test`, `build` を順番に実行。大規模 CSV の性能テストは `scripts/benchmark.ts` を用意し、将来のロードマップに備える。

---

## 12. DevOps / 運用

- **環境変数**：`config/env.ts` で安全に読み出し。`zod` でスキーマ定義し、値が無い場合はビルド失敗。

```ts
// config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  CSV_MAX_ROWS: z.coerce.number().default(10000),
});

type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);
```

- **デプロイ**：
  - Vercel: ビルドコマンド `pnpm run build`。Supabase URL/keys を Project Settings に登録。
  - Cron Job やバッチは Supabase Edge Functions で後続対応。
- **監視**：Sentry（`@sentry/nextjs`）を導入し、API/フロントエンドのエラーを追跡。
- **ロギング**：`pino` ベースで構築し、`/api/ingest` の処理サマリを構造化ログとして出力。

---

## 13. ワークフロー

1. `pnpm install`
2. `pnpm run lint`
3. `pnpm run test`
4. `pnpm run dev`（`localhost:3000`）
5. 開発完了後 `pnpm run build` + `pnpm run start` で本番挙動確認。

コミット前に `lint-staged` を通し、`pre-commit` で `pnpm run check` を強制。Migration は `supabase migration new` で生成し、`supabase db push` で同期。

---

## 14. 今後の拡張に向けた備考

- **非同期バッチ**：5万行以上の CSV は Supabase Storage へアップロードし、Edge Function でキュー処理。
- **マスタデータ**：ブランド/タイプ辞書を別テーブル化し、UI でサジェストを提供。
- **アクセス制御**：IP 制限や多要素認証の追加を想定。NextAuth + Supabase Auth のハイブリッドも検討。
- **Observability**：Grafana Cloud や Supabase Logs を活用し、API レイテンシ監視。

---

## 15. 参考コマンド

```bash
# Supabase ローカル起動
supabase start

# テーブル作成 (migration)
supabase migration new init_sales_table
supabase db push

# Playwright テスト
pnpm exec playwright test --project=chromium
```

---

以上を基準として Next.js 実装を進めれば、要件定義書のMVPスコープを満たしつつ、将来拡張への布石を残せます。
