# Task 04: Brand Access強化とCSVバリデーション修正

Claude Code 向けの次タスク指示書です。現状コードを踏まえて、ブランド抽出後のデータを適切に活用し、担当ブランドのみが閲覧できる状態へ仕上げます。MVP要件 (`docs/requirement.md`) を満たすため、以下の 3 点に集中してください。

---

## ゴール

1. CSV 日付バリデーションを厳密化し、不正な日付行をエラーとして扱う。
2. 自動抽出したブランド名を `row_hash` に反映し、冪等性ロジックを仕様どおりにする。
3. Supabase から担当ブランドを動的に取得し、ブランド一覧と BrandGate の制御を RLS に基づく実データ連動へ更新する。

---

## 前提リソース

- 要件: `docs/requirement.md`
- 技術ガイド: `docs/nextjs_technical_guide.md`
- CSV インポート実装: `docs/task-03-csv-ingest.md`
- ブランド抽出実装報告: `work.log/2025-01-17-brand-extraction-implementation.md`
- 現行コード参照
  - `lib/csv/schema.ts`
  - `lib/csv/hash.ts`
  - `app/api/ingest/route.ts`
  - `lib/csv/brand-extractor.ts`
  - `app/dashboard/BrandGate.tsx`
  - `app/brand/page.tsx`

---

## 実装ステップ

### 1. 日付バリデーションの厳密化

- 対象: `lib/csv/schema.ts`
- 現状 `new Date()` 依存のため `2024/02/30` などが通過してしまいます。
- `parseStrictDate` ヘルパーを実装し、`YYYY/MM/DD` または `YYYY-MM-DD` を正規表現で分解 → `Date.UTC` で検証 → 入力と一致しない場合はエラーにする。
- Zod の `superRefine` もしくは `refine` を活用し、エラーメッセージを「Invalid date format: ...」に合わせる。

### 2. row_hash のブランド反映

- 対象: `lib/csv/hash.ts`, `app/api/ingest/route.ts`
- 方針:
  1. `createRowHash` を `(row: ParsedCsvRow, brand: string)` のシグネチャに変更し、結合キーに `brand` を反映する（大文字小文字は統一）。
  2. `/api/ingest` で `determineBrand(row, file.name)` の結果を変数 `brand` として保持し、`row_hash` 生成時と Supabase upsert 時に同じ値を使う。
  3. Supabase へ送るブランド名は `brand` をそのまま利用。空文字が渡らないことを確認。
- 必要に応じて `SalesRow` 型（`lib/csv/schema.ts`）を更新し、ブランド付きの構造を扱いやすくする。

### 3. ブランド一覧と BrandGate の動的化

#### 3.1 Supabase クエリユーティリティ
- 新規: `lib/sales/brands.ts`
- 実装内容:
  - `toBrandSlug(name: string): string`（`lowercase` + 空白を `-` 置換）。
  - `fromBrandSlug(slug: string): string`（人間向けラベルへ戻す。必要なら最初の単語だけ capitalize）。
  - `async function fetchAccessibleBrands()`:
    - `getSupabaseServerClient()` を利用。
    - `supabase.from('sales').select('brand', { distinct: true })` で取得。
    - `brand` が `null`/空文字の行は除外。
    - RLS により返却されるブランド = ログインユーザーがアクセス可能なブランド。
    - 返却値は `{ name: string; slug: string }[]`。
  - `async function ensureBrandAccessible(slug: string)`:
    - `supabase.from('sales').select('brand', { count: 'exact', head: true }).eq('brand', decodedName)` を実行。
    - `count === 0` で `false` を返す。例外はそのまま投げる。

#### 3.2 BrandGate の更新
- 対象: `app/dashboard/BrandGate.tsx`
- ロジックを以下に改修:
  - `brand` が指定された場合のみ Supabase 照会を実施。
  - `ensureBrandAccessible` を呼び、`false` の場合 `notFound()`。
  - ブランド未指定の場合（ダッシュボード全体）はそのまま `children` を返す。
  - `getCurrentUser` のモックブランド配列は不要になるため、`lib/auth/user.ts` の利用箇所を削除し、同ファイルの中身も「将来 Supabase Auth と統合予定」のコメントに留める。

#### 3.3 ブランド一覧ページの更新
- 対象: `app/brand/page.tsx`
- `mockBrands` を廃止し、サーバーコンポーネントで `fetchAccessibleBrands()` を呼び出す。
- 取得結果が 0 件の場合は「閲覧可能なブランドがありません」表示。
- リンク先は `slug` を利用し、表示名は `name`。

#### 3.4 ブランド詳細ページの表示名統一
- 対象: `app/brand/[brand]/page.tsx`
- `decodeURIComponent` と `replace` での大文字化ではなく、`fromBrandSlug` を使って見出しを表示。
- `BrandGate` 内でアクセスチェックが走るため、`BrandGate` 呼び出しを維持。

### 4. 動作確認

1. `npm run lint`
2. `npm run type-check`
3. 手動テスト
   - `.env.local` に Service Role Key 等が設定済みであることを確認。
   - Supabase に存在するデータが Moncler のみの場合、`/brand` で Moncler だけが表示されること。
   - `/brand/moncler` にアクセスしてページが表示されること。
   - Supabase 側で RLS によってブランドが許可されていないユーザーの場合、`BrandGate` が `notFound()` を返すことを想定したコードパスになっていること。
   - 不正日付を含む CSV をアップロードすると 400 が返り、該当行が `failed_rows` に記録されること。

---

## 受け入れ基準

- CSV の不正日付が `ValidationFailed` としてレスポンスに含まれる。
- `sales` テーブルの `row_hash` がブランド名を含むハッシュに基づき生成され、新旧データ差し替え時に例外なく動作する。
- `/brand` ページが Supabase の実データをもとにブランド一覧を表示し、モック値が存在しない。
- `BrandGate` が Supabase RLS に基づきブランドアクセス可否を判定する実装に置き換わっている。
- `npm run lint` と `npm run type-check` が成功する。

---

## 備考

- 認証と JWT 連携 (`brand_codes` クレーム) は別タスクで扱います。今回の `BrandGate` は RLS によるフィルタ結果を利用する実装としてください。
- `fetchAccessibleBrands` は今後のダッシュボードフィルタでも再利用予定。関数名・返却型は汎用的に保ってください。
- 既存の `lib/auth/user.ts` は最小限のコメントに更新し、使用していないことが lint エラーとならないように調整してください。

以上を完了したら、作業内容を `work.log/2025-01-17-task-04.md` にまとめてください。
