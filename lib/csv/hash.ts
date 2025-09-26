import { createHash } from 'crypto';
import type { ParsedCsvRow } from './schema';

/**
 * CSV行からrow_hashを生成
 * ハッシュキー: sale_date|brand|type|rank|model_number|sale_quantity|adjusted_exp_sale_price|appraised_price|selling_price
 */
export function createRowHash(row: ParsedCsvRow, brand: string): string {
  // ハッシュに使用するフィールドを指定順序で結合
  const hashFields = [
    row.sale_date,
    brand.toUpperCase().trim(), // ブランド名は大文字統一
    (row.type || '').toLowerCase().trim(),
    (row.rank || '').toLowerCase().trim(),
    (row.model_number || '').toLowerCase().trim(),
    row.sale_quantity?.toString() || '1',
    row.adjusted_exp_sale_price?.toString() || '0',
    row.appraised_price?.toString() || '0',
    row.selling_price.toString(),
  ];

  const hashInput = hashFields.join('|');
  const hash = createHash('sha256').update(hashInput).digest('hex');

  return hash;
}