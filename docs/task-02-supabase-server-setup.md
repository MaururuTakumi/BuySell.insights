# Task 02: Supabase Server クライアントとブランド権限制御の土台整備

Codex CLI 向けの次作業指示です。`docs/requirement.md` と `docs/nextjs_technical_guide.md` の要件を踏まえて、Supabase 認証/RLS を導入するためのサーバー側基盤を整えます。

---

## 目的

1. ブラウザでサービスロールキーを扱わずに Supabase へ安全に接続できるよう、サーバークライアント初期化ロジックを整理する。
2. ブランド権限制御に備え、ユーザーのブランド配列を取得するためのスタブを追加し、BrandGate から活用できるようにする。
3. 今後の CSV 取り込み/API 実装時に再利用できる共通ユーティリティを整備する。

---

## 対象ファイル / 追加予定ファイル

- `lib/supabase/server.ts`
- `lib/auth/user.ts`（新規）
- `app/dashboard/BrandGate.tsx`
- `app/brand/[brand]/page.tsx`（BrandGate 利用へ修正）
- `config/env.ts`（必要ならサービスロール専用処理を追加）

---

## 実装タスク

1. **Supabase サーバークライアントの再構築**
   - `getSupabaseServerClient` をリクエストごとに初期化し、`cookies()` からセッショントークンを取得。
   - サービスロールキーは `getSupabaseServiceRoleClient` のみに限定し、他の関数で共有しない。
   - TODO: Supabase Auth 統合時に `headers()` から `Authorization` を取得できるようコメントで示す。

2. **ユーザー情報取得ユーティリティ**
   - `lib/auth/user.ts` に `getCurrentUser()`（サーバー用）を追加。
   - ブランド配列 `brandCodes` を返すスタブ（仮実装）として `TODO` コメントで Supabase Profile 取得を指示。
   - ブランドが未設定の場合は空配列を戻す。

3. **BrandGate コンポーネント**
   - `app/dashboard/BrandGate.tsx` を新規作成し、サーバーコンポーネントとしてブランド権限を読み、子要素を条件付きで表示。
   - 権限がない場合は 403 表示 or `redirect('/')` のいずれかを採用（MVP は `notFound()` で可）。

4. **ブランドページで BrandGate を利用**
   - `app/brand/[brand]/page.tsx` で BrandGate を読み込み、担当ブランド以外にアクセスした場合の制御を組み込む。
   - 現状の placeholder 表示は維持しつつ、BrandGate の中で表示する。

---

## 受け入れ条件

- `lib/supabase/server.ts` がリクエストスコープの初期化になっていること。
- ブラウザバンドルにサービスロールキーが含まれないこと（インポート関係を確認）。
- `BrandGate` がブランド権限制御の土台として動作し、ブランド外アクセス時に `notFound()` を返す。
- `npm run lint` と `npm run type-check` が成功すること。

---

## 実行時メモ

- Supabase Auth 連携は未実装なので、`getCurrentUser()` はモック的な戻り値（例: 暫定で全ブランド許可）でも可。将来差し替える旨のコメントを残す。
- brand slug は URL エンコードされているので、`decodeURIComponent` 後に比較すること。
- 場合によっては `next/navigation` の `redirect` や `notFound` を利用する。SSR である点に注意。

---

## テスト・検証

```bash
npm run lint
npm run type-check
```

必要に応じて `npm run dev` で `/brand/test-brand` にアクセスし、BrandGate の挙動を目視確認してください。
