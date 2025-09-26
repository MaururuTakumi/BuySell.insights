import type { ParsedCsvRow } from './schema';

/**
 * ファイル名からブランド名を抽出
 */
export function extractBrandFromFilename(filename: string): string | null {
  // 拡張子を除去
  const nameWithoutExt = filename.toLowerCase().replace(/\.(csv|txt)$/i, '');

  // ブランド名マッピング
  const brandMappings: Record<string, string> = {
    'moncler': 'MONCLER',
    'louis_vuitton': 'LOUIS VUITTON',
    'louisvuitton': 'LOUIS VUITTON',
    'lv': 'LOUIS VUITTON',
    'chanel': 'CHANEL',
    'hermes': 'HERMES',
    'gucci': 'GUCCI',
    'prada': 'PRADA',
    'dior': 'DIOR',
    'cartier': 'CARTIER',
    'rolex': 'ROLEX',
    'celine': 'CELINE',
    'bottega': 'BOTTEGA VENETA',
    'bottega_veneta': 'BOTTEGA VENETA',
    'balenciaga': 'BALENCIAGA',
    'burberry': 'BURBERRY',
    'fendi': 'FENDI',
    'coach': 'COACH',
    'canada_goose': 'CANADA GOOSE',
    'canadagoose': 'CANADA GOOSE',
    'supreme': 'SUPREME',
    'off_white': 'OFF-WHITE',
    'offwhite': 'OFF-WHITE',
  };

  // ファイル名からブランド名を検索
  for (const [key, brand] of Object.entries(brandMappings)) {
    if (nameWithoutExt.includes(key)) {
      return brand;
    }
  }

  return null;
}

/**
 * 商品特性からブランドを推測
 */
export function inferBrandFromProduct(row: ParsedCsvRow): string | null {
  const material = row.material?.toLowerCase() || '';
  const type = row.type?.toLowerCase() || '';
  const price = row.selling_price;
  const modelNumber = row.model_number?.toLowerCase() || '';
  const itemGroup = row.item_type_group?.toLowerCase() || '';

  // model_numberからの推測
  if (modelNumber) {
    // LOUIS VUITTONの型番パターン
    if (/^[mn]\d{5}/.test(modelNumber)) return 'LOUIS VUITTON';
    // CHANELの型番パターン
    if (/^a\d{5}/.test(modelNumber)) return 'CHANEL';
    // HERMESの型番パターン
    if (modelNumber.includes('birkin') || modelNumber.includes('kelly')) return 'HERMES';
    // ROLEXの型番パターン
    if (/^\d{6}/.test(modelNumber)) return 'ROLEX';
  }

  // materialとtypeの組み合わせからの推測
  if (material.includes('ダウン') || material.includes('down')) {
    if (type.includes('アウター') || type.includes('ジャケット') || type.includes('コート')) {
      // 価格帯でブランドを推測
      if (price > 100000) return 'MONCLER';
      if (price > 50000) return 'CANADA GOOSE';
      return 'MONCLER'; // デフォルト
    }
  }

  // レザーバッグの推測
  if (material.includes('レザー') || material.includes('leather')) {
    if (type.includes('バッグ') || type.includes('bag')) {
      if (price > 2000000) return 'HERMES';
      if (price > 500000) return 'CHANEL';
      if (price > 300000) return 'LOUIS VUITTON';
      if (price > 100000) return 'GUCCI';
    }
  }

  // モノグラムやキャンバス
  if (material.includes('モノグラム') || material.includes('monogram')) {
    return 'LOUIS VUITTON';
  }

  if (material.includes('gg') || material.includes('グッチ')) {
    return 'GUCCI';
  }

  // item_type_groupからの推測
  if (itemGroup) {
    const brandKeywords = {
      'moncler': 'MONCLER',
      'louis vuitton': 'LOUIS VUITTON',
      'chanel': 'CHANEL',
      'hermes': 'HERMES',
      'gucci': 'GUCCI',
      'prada': 'PRADA',
      'cartier': 'CARTIER',
      'rolex': 'ROLEX',
    };

    for (const [keyword, brand] of Object.entries(brandKeywords)) {
      if (itemGroup.includes(keyword)) {
        return brand;
      }
    }
  }

  // 時計の推測
  if (type.includes('時計') || type.includes('watch')) {
    if (price > 3000000) return 'ROLEX';
    if (price > 1000000) return 'PATEK PHILIPPE';
    if (price > 500000) return 'OMEGA';
    if (price > 300000) return 'CARTIER';
  }

  // ジュエリーの推測
  if (type.includes('ネックレス') || type.includes('指輪') || type.includes('ブレスレット')) {
    if (price > 1000000) return 'CARTIER';
    if (price > 500000) return 'TIFFANY';
    if (price > 300000) return 'BULGARI';
  }

  return null;
}

/**
 * ブランド名を決定（ファイル名優先、次に商品特性）
 */
export function determineBrand(
  row: ParsedCsvRow,
  filename?: string
): string {
  // 既にブランドが設定されている場合はそのまま返す
  if (row.brand && row.brand.trim() !== '') {
    return row.brand;
  }

  // ファイル名からブランドを抽出
  if (filename) {
    const brandFromFilename = extractBrandFromFilename(filename);
    if (brandFromFilename) {
      return brandFromFilename;
    }
  }

  // 商品特性からブランドを推測
  const inferredBrand = inferBrandFromProduct(row);
  if (inferredBrand) {
    return inferredBrand;
  }

  // デフォルト値
  return 'UNKNOWN';
}