import { z } from 'zod';

// 厳密な日付パーサー（YYYY/MM/DD または YYYY-MM-DD 形式を受け付ける）
function parseStrictDate(val: string): string {
  // 正規表現で日付を分解
  const slashMatch = val.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  const dashMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  const match = slashMatch || dashMatch;
  if (!match) {
    throw new Error(`Invalid date format: ${val}. Expected YYYY/MM/DD or YYYY-MM-DD`);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Date.UTCで日付を検証
  const date = new Date(Date.UTC(year, month - 1, day));

  // 入力と一致しない場合（不正な日付）はエラー
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${val}`);
  }

  // ISO形式の日付文字列で返す（YYYY-MM-DD）
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const dateParser = z.string().transform((val) => {
  return parseStrictDate(val);
});

// 整数パーサー（カンマ区切りを除去）
const integerParser = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    return val.replace(/,/g, '');
  }
  return val;
}, z.coerce.number().int().optional());

// CSV行のスキーマ定義
export const SalesCsvRowSchema = z.object({
  // 必須フィールド
  sale_date: dateParser,
  selling_price: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.replace(/,/g, '');
    }
    return val;
  }, z.coerce.number().int()),

  // 任意フィールド（デフォルト値付き）
  sales_channel: z.string().optional().default(''),
  sale_contact: z.string().optional().default(''),
  item_type_group: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  rank: z.string().optional().default(''),
  type: z.string().optional().default(''),
  model_number: z.string().optional().default(''),
  material: z.string().optional().default(''),
  sale_quantity: integerParser.default(1),
  adjusted_exp_sale_price: integerParser.default(0),
  appraised_price: integerParser.default(0),
});

// パース済みのCSV行の型
export type ParsedCsvRow = z.infer<typeof SalesCsvRowSchema>;

// データベース用の行型（row_hashとyear_monthを追加）
export interface SalesRow extends ParsedCsvRow {
  row_hash: string;
  year_month?: string; // トリガーで自動設定されるため、挿入時は不要
}