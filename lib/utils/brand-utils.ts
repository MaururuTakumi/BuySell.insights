/**
 * ブランド名のユーティリティ関数
 * クライアント/サーバー両方で使用可能
 */

/**
 * ブランド名をURLスラッグに変換
 * @param name ブランド名
 * @returns URLスラッグ
 */
export function toBrandSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * URLスラッグをブランド名に戻す
 * @param slug URLスラッグ
 * @returns ブランド名（最初の単語を大文字化）
 */
export function fromBrandSlug(slug: string): string {
  const words = slug.split('-');
  return words
    .map((word, index) => {
      // 特定のブランド名はすべて大文字
      if (['lv', 'ysl', 'dg'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      // それ以外は最初の文字だけ大文字化
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}