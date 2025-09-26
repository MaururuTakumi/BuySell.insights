# Task 03: CSV Ingest API 実装ガイド

以下の手順に従い、`/api/ingest` エンドポイントを MVP 要件に沿って実装してください。`docs/requirement.md`, `docs/nextjs_technical_guide.md`, `work.log/2024-09-17-db.md`, `work.log/2025-01-17-supabase-setup-report.md` を参照しながら進めます。

---

## 目的

1. 管理者が CSV をアップロードすると Supabase `public.sales` に upsert されること。
2. `row_hash` によって重複/更新を自動判定し、冪等性を保証すること。
3. 取り込み結果を JSON で返し、エラー時は原因行を通知できるようにすること。

---

## 前提条件

- Supabase スキーマと RLS はすでに `sales` と `ingest_logs` に設定済み。
- サービスロールキーはサーバールート内でのみ利用可能（`getSupabaseServiceRoleClient`）。
- CSV は UTF-8, ヘッダーあり。日付・整数形式は `docs/requirement.md` の仕様に従う。

---

## 対象/新規ファイル

- `app/api/ingest/route.ts`
- `lib/csv/parser.ts`（新規）
- `lib/csv/schema.ts`（新規）
- `lib/csv/hash.ts`（新規）
- `lib/csv/errors.ts`（新規, 任意）
- `lib/supabase/server.ts`（補強が必要な場合のみ）

---

## 実装ステップ

1. **行スキーマ定義** (`lib/csv/schema.ts`)
   - `zod` で `SalesCsvRowSchema` を作成。
   - 必須列: `sale_date`, `selling_price`。
   - 任意列にはデフォルト値（例: quantity=1, adjusted/appraised=0）。
   - 日付は `YYYY/MM/DD` or `YYYY-MM-DD` を許容し、`Date` に変換後 ISO 文字列で返す。

2. **CSV パーサ実装** (`lib/csv/parser.ts`)
   - `fast-csv` または `csv-parse` を使用してストリームで処理。
   - 行ごとに `SalesCsvRowSchema` で検証し、成功/失敗を収集。
   - `env.CSV_MAX_ROWS` を超えた場合はエラーを返す。
   - 戻り値: `{ validRows: ParsedRow[], failedRows: FailedRowReport[] }`

3. **row_hash 生成** (`lib/csv/hash.ts`)
   - `createRowHash(row: ParsedRow)` を実装。
   - ハッシュキー: `sale_date|brand|type|rank|model_number|sale_quantity|adjusted_exp_sale_price|appraised_price|selling_price`。
   - 文字列をトリムして小文字化を検討（要件協議済み）。
   - `crypto` の `createHash('sha256')` を利用。

4. **Supabase upsert** (`app/api/ingest/route.ts`)
   - Multipart の CSV ファイルを `ReadableStream` に変換して `parseCsv` に渡す。
   - `validRows` を 200〜500 行のバッチに分割。
   - `supabase.from('sales').upsert(batch, { onConflict: 'row_hash' })` を利用し、更新時 `updated_at` が変更されることを確認。
   - 成功件数/更新件数を集計。Supabase API から返る `count` を活用。

5. **監査ログ記録** (`ingest_logs`)
   - `getSupabaseServiceRoleClient()` でインサート。
   - `failed_rows` は JSON 配列で保存。サイズが大きい場合は最初の 20 行に制限。
   - ロギングは try/catch で囲み、失敗してもメイン処理は継続。

6. **レスポンス設計**
   - 成功: `{ ok: true, processed, upserted, failed: failedRows.length }` を 200 で返す。
   - 検証失敗のみ: 400 で `{ error: 'ValidationFailed', details: failedRows }`。
   - 予期せぬエラー: 500 で `{ error: 'InternalError' }`。`console.error` で詳細をログ。

7. **TODO の明示**
   - 認証/権限（Service Role 保護や Basic Auth）は別タスク。保留点はコメントで明記。

---

## テスト・検証

1. `npm run lint`
2. `npm run type-check`
3. 単体テスト（任意）: `vitest` などで `createRowHash`, `SalesCsvRowSchema` を検証。
4. 手動検証例:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -F "file=@./fixtures/sample_sales.csv"
   ```
   - Supabase コンソールで `sales`, `ingest_logs` にレコードが入ることを確認。

---

## 受け入れ基準

- `/api/ingest` に CSV を送信すると Supabase `sales` テーブルへ upsert され、同一 CSV を再投入しても重複しない。
- レスポンスに `processed`, `upserted`, `failed` が含まれ、失敗行が明示される。
- `ingest_logs` に処理結果が記録される。
- Lint/TypeScript チェックが成功する。

---

## 参考情報

- `docs/requirement.md` 5章, 8章, 9章
- `docs/nextjs_technical_guide.md` 5章, 8章, 9章
- Supabase 型定義: `lib/supabase/types.ts`
- 既存実装例: `app/dashboard/BrandGate.tsx` でのブランド制御

疑問が残った場合は TODO コメントを残し、次のレビューで解消してください。
