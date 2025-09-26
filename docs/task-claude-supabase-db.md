# Task: Supabase MCP でデータベース設計を完了する

Claude Code (Supabase MCP 接続済み CLI エージェント) 向けの作業指示です。`docs/requirement.md` と `docs/nextjs_technical_guide.md` を参照し、MVP に必要な Supabase データベーススキーマとポリシーを構築します。Claude は段取りが苦手なので、手順を順番に実行してください。

---

## 事前確認

1. Supabase MCP が接続済みで `supabase` コマンドを利用できることを確認する。
2. 必要な参照ファイル:
   - `docs/requirement.md`
   - `docs/nextjs_technical_guide.md`
   - `docs/task-02-supabase-server-setup.md`（ブランド権限の背景把握用）

---

## 実装ゴール

- `sales` テーブルを要件通りに作成し、必要な列・インデックス・トリガーを備える。
- ブランド別閲覧制御を実現する RLS ポリシーを設定する。
- 監査ログ用の `ingest_logs` テーブルを将来用途として用意する（スキーマだけで可）。
- Supabase 側の SQL はマイグレーションファイルとして `supabase/migrations` に保存する。

---

## 作業手順

1. **既存プロジェクト確認**
   - `supabase status` または `supabase projects list` で接続情報を確認。
   - ローカル開発の場合は `supabase start` で起動してから作業する。

2. **マイグレーション作成**
   - `supabase migration new init_sales_schema` を実行し、空の SQL ファイルを生成。

3. **SQL 実装**
   - 生成されたファイルに以下を実装:
     - `sales` テーブル（要件表の列 + `year_month`, `margin_adj`, `margin_app`, `row_hash` 等）。
     - `trigger_set_timestamp` 関数 + トリガー。
     - `ingest_logs` テーブル（`id`, `filename`, `processed`, `inserted`, `updated`, `failed_rows`, `created_at`）。
   - データ型は `integer`, `date`, `text`, `uuid`, `timestamptz` を活用。

4. **インデックスと制約**
   - `row_hash` 一意制約。
   - `sale_date`, `brand`, `rank`, `type`, `year_month` へのインデックス。

5. **RLS 設定**
   - `sales` テーブルで RLS を有効化。
   - ポリシー例：サービスロールは全操作可、一般ユーザーは `brand = ANY (jwt claim brand_codes)` の行のみ `select` 許可。
   - `ingest_logs` は後続利用のため RLS 無効のままでもよいが、必要ならサービスロール専用に限定。

6. **マイグレーション適用**
   - `supabase db push` を実行し、エラーがないか確認。

7. **確認**
   - `supabase db describe` でテーブル・ポリシーを確認。
   - 重要な結果をメモとして `work.log/2024-09-17-db.md`（新規）に記録（例: マイグレーション名、実行コマンド、結果）。

---

## 受け入れ基準

- `supabase/migrations/*init_sales_schema*.sql` にスキーマ・インデックス・RLS 設定が含まれている。
- `supabase db push` が成功し、`supabase db describe` に `sales` テーブルとポリシーが反映されている。
- `work.log/2024-09-17-db.md` に今回の作業内容が記録されている。

---

## 覚えておくこと

- 文字列列は `text`、金額は `integer`、日付は `date` を使用する。
- `row_hash` は `text` + `unique index`。
- RLS で参照する JWT クレーム名は `brand_codes` を想定。存在しない場合は空配列として扱うコメントを残す。
- 先行タスクで未実装の部分は `TODO` コメントを SQL に残してもよい。

---

これらを順番に実施し、結果をログにまとめた上で完了報告してください。
