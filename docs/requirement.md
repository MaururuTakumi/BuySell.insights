# BUYSELL ダッシュボード要件定義（MVP）

本書は **Codex とエンジニア間で共通認識を持つための日本語要件定義（Markdown）** です。まずは CSV 取り込み→差分検知→Supabase 保存→ダッシュボード表示までを MVP とします。

---

## 1. 背景と目的

* 弊社 BUYSELL Technologies の売買データ（仕入・査定・販売）をもとに、**ブランド別ダッシュボード**を社内/取引先に提供する。
* 最初の目的：

  * CSV を管理画面からアップロードし、**重複や更新を自動判定**してデータベースへ反映。
  * Web ダッシュボードで **集計・可視化・絞り込み**ができる状態にする。

---

## 2. スコープ（MVP）

* 管理者用 CSV アップロード UI（1画面）
* サマリー/散布図/テーブルを備えたダッシュボード（1〜2画面）
* ブランド別の簡易ビュー（ルーティングのみでも可）
* Supabase を用いたデータ格納・取得
* 差分検知（同一行識別＋更新上書き）
* 基本的な権限制御（閲覧は社内、書き込みは管理者のみ、**担当ブランド以外のデータは非表示**）

> 非スコープ（後続）：高度なロール管理、外部公開、在庫連携、ジョブスケジューラ、BI連携、ワークフロー承認。

---

## 3. 用語定義

* **adjusted\_exp\_sale\_price**：当社が買取時に最大で出せる金額（上限買取目安）。
* **appraised\_price**：実際の買取金額（査定確定額）。
* **selling\_price**：最終販売価格。
* **margin\_adj**：`selling_price - adjusted_exp_sale_price`。
* **margin\_app**：`selling_price - appraised_price`。

---

## 4. データ仕様（CSV カラム）

**想定ヘッダー（順不同可、名称は厳密一致）**

| 列名                         | 型                | 必須       | 説明                        |
| -------------------------- | ---------------- | -------- | ------------------------- |
| sale\_date                 | `YYYY/MM/DD` 文字列 | 必須       | 販売日。タイムゾーンは JST 前提。       |
| sales\_channel             | 文字列              | 任意       | toC / toB など。             |
| sale\_contact              | 文字列              | 任意       | 所属や担当部門。                  |
| item\_type\_group          | 文字列              | 任意       | ブランド/ジュエリー等のグループ。         |
| brand                      | 文字列              | 任意       | 例: LOUIS VUITTON, CHANEL。 |
| rank                       | 文字列              | 任意       | A/AB/B/C 等。               |
| type                       | 文字列              | 任意       | リュック/ショルダー/コート等。          |
| model\_number              | 文字列              | 任意       | 型番。                       |
| material                   | 文字列              | 任意       | レザー/PVC 等。                |
| sale\_quantity             | 整数               | 任意(既定=1) | 販売数量。                     |
| adjusted\_exp\_sale\_price | 整数               | 任意(既定=0) | 上限買取目安。                   |
| appraised\_price           | 整数               | 任意(既定=0) | 実査定。                      |
| selling\_price             | 整数               | **必須**   | 販売額。                      |

**受け入れ条件**

* 文字コード: UTF-8、ヘッダー行あり、カンマ区切り。
* 数値列はカンマ無し整数（`42136`）。桁区切り含む場合は取り込み側で除去可。
* 日付は `YYYY/MM/DD` または `YYYY-MM-DD`。パース不可行はエラー行として記録。

---

## 5. 差分検知・重複ルール

* 1行ごとに **行ハッシュ（row\_hash）** を作成し、一意制約で **upsert**。
* 行ハッシュの材料（提案）：

  * `sale_date | brand | type | rank | model_number | sale_quantity | adjusted_exp_sale_price | appraised_price | selling_price`
* 既存 `row_hash` と一致 → 更新（値が違えば上書き）。
* 一括投入は 500 行程度のチャンクで処理（タイムアウト回避）。
* 結果レスポンス：`processed`（受領件数）, `upserted`（新規＋更新の概算）。

**注意**: 将来「同日同型番の複数レコード」が想定される場合は、`source_file + row_no` などの物理キーも設ける。

---

## 6. 画面要件

### 6.1 管理者：CSV アップロード

* ファイル選択→送信→結果 JSON をその場で表示。
* 失敗時：最初のエラー内容と「何行目か」を表示。
* 成功時：`processed`/`upserted` を表示。
* 対応ファイル拡張子：`.csv` のみ。

### 6.2 ダッシュボード（一覧）

* サマリーカード：

  * 総販売額 / 調整予想額合計 / 査定額合計
  * 平均マージン（販売-調整）/（販売-査定）
* フィルタ：`type`、`rank`（複数選択 or 単一選択はMVPでは単一選択で可）
* 散布図：X=仕入系価格（調整 or 査定の切替/複数表示可）/ Y=販売価格
* ランク別サマリー表、月次トレンド表、マージン上位/下位リスト（各5件）
* ブランド別ページ：`/brand/[brand]` に遷移できるリンク（MVPは同様の集計でOK）。**ログインユーザーは自身の担当ブランドのみ閲覧可能。**

**UIメモ**：提示済み HTML デザインを React 化。表示値は `ja-JP` の桁区切り。

---

## 7. 集計要件（サーバ or クライアント）

* **サマリー**：

  * `total_selling = Σ selling_price`
  * `total_adjusted = Σ adjusted_exp_sale_price`
  * `total_appraised = Σ appraised_price`
  * `avg_margin_adj = 平均(selling - adjusted)`
  * `avg_margin_app = 平均(selling - appraised)`
* **グルーピング**：

  * ランク別（`rank`）: 件数、総販売額、平均マージン（販売-調整）
  * 月次（`year_month`）: 件数、総販売額、平均マージン（販売-調整）
* **トップ/ボトム**：`margin_adj` 降順上位5 / 昇順上位5
* **散布図データ**：`[{series: 'adjusted'|'appraised', x, y, meta...}]`

> MVPではクライアント集計でOK。パフォーマンス課題が出たら API/SQL 集計に切替。

---

## 8. API 仕様（MVP）

* `POST /api/ingest`：multipart/form-data（field: `file`）

  * 成功: `{ ok: true, processed: number, upserted: number }`
  * 失敗: `{ error: string }`
* `GET /api/sales?brand=&type=&rank=&from=&to=`（任意）

  * レコード取得（ページングは後続）。
* `GET /api/metrics?brand=&type=&rank=`（任意）

  * サマリー/グループ集計を返す（後続）。

---

## 9. データベース（Supabase / PostgreSQL）

* テーブル：`public.sales`

  * 主キー：`id (uuid)`
  * 派生列：`year_month (YYYY/MM)`, `margin_adj`, `margin_app`
  * 一意制約：`row_hash`
  * インデックス：`sale_date`, `brand`, `rank`, `type`, `year_month`
* RLS：有効化。**select は許可**、**insert/update はサービスロールのみ**。

---

## 10. セキュリティ/権限

* 閲覧：社内（Anon key）
* 書込（CSV 取り込み）：サーバ側のみ（Service role key）。
* 管理画面は簡易認証（社内向けのベーシック認証か Supabase Auth）。ブランド担当者の閲覧権限は **担当ブランドのデータに限定** する（例：Moncler 担当は Moncler のみ、Louis Vuitton 担当は LV のみ）。

---

## 11. エラーハンドリング・監査

* 取り込み失敗：最初のエラー内容＋件数を返却。
* 監査ログ（後続で）：`ingest_logs(id, filename, processed, inserted, updated, failed_rows, created_at)`
* 不正な日付/金額はスキップし、`failed_rows` に明記。

---

## 12. 非機能要件

* パフォーマンス：CSV 1万行を 30 秒以内目安（サーバのアップロード＋DB upsert）。
* 可用性：MVP は単一リージョン、夜間メンテ可。
* コスト：Supabase Free/Pro の範囲を意識（課金は監視）。

---

## 13. 受け入れ基準（Acceptance Criteria）

1. 管理画面から CSV をアップロードすると、`processed/upserted` が返り、DB に反映される。
2. 同じ CSV を再度アップロードしても **重複は増えず**（idempotent）、変更があれば更新される。
3. ダッシュボードで合計・平均・ランク別・月次の数値が CSV と一致する。
4. フィルタを変えると、サマリー/表/散布図が連動して変化する。
5. 異常系（不正日付など）でエラーが表示され、投入はロールバックまたはスキップ記録される。

---

## 14. 運用・手順メモ

* CSV ヘッダーの命名は上表に統一。既存名が違う場合は**アップロード前にマッピング**してから投入。
* 月次集計は `sale_date` から `YYYY/MM` を派生して利用。
* 表示通貨は円。整数で管理、UI で桁区切り。

---

## 15. 今後の拡張（ロードマップ）

* 別名ヘッダーの自動マッピング辞書（例：`brand_manufact → brand`）。
* 大規模 CSV（>5万行）の非同期取り込み＆進捗表示。
* 認証/権限の厳格化、IP 制限、監査テーブル。
* 外部公開用の閲覧限定リンク（テナント隔離）。
* 高速集計のためのマテリアライズドビュー/ETL。

---

## 付録：UI 要素対応（参考）

* **サマリーカード**：総販売額、平均マージン（2種）、調整予想額合計、査定額合計。
* **フィルタ**：`type`、`rank`。シリーズ切替（調整/査定）。
* **散布図**：y=販売価格、x=（調整 or 査定）。対角線ガイドあり。
* **テーブル**：ランク別・月次・マージン上位/下位（各5件）。

> 上記 UI は既存 HTML の雰囲気を踏襲して React 化予定。
