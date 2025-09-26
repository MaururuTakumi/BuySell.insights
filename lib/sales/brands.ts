import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';

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

/**
 * ログインユーザーがアクセス可能なブランド一覧を取得
 * @returns ブランド一覧 { name: string; slug: string }[]
 */
export async function fetchAccessibleBrands(): Promise<{ name: string; slug: string }[]> {
  // 現在は認証が未実装のため、Service Roleクライアントを使用
  // TODO: 認証実装後はgetSupabaseServerClient()に変更し、RLSでアクセス制御
  const supabase = getSupabaseServiceRoleClient();

  // RLSによりアクセス可能なブランドのみ取得
  const { data, error } = await supabase
    .from('sales')
    .select('brand')
    .not('brand', 'is', null)
    .not('brand', 'eq', '')
    .order('brand');

  if (error) {
    console.error('Error fetching accessible brands:', error);
    return [];
  }

  // 重複を除去してブランド一覧を作成
  const uniqueBrands = Array.from(
    new Set(data?.map((row) => row.brand) || [])
  ).filter(Boolean) as string[];

  return uniqueBrands.map((brand) => ({
    name: brand,
    slug: toBrandSlug(brand),
  }));
}

/**
 * 指定されたブランドへのアクセス権限を確認
 * @param slug ブランドのURLスラッグ
 * @returns アクセス可能な場合true、そうでない場合false
 */
export async function ensureBrandAccessible(slug: string): Promise<boolean> {
  // 現在は認証が未実装のため、Service Roleクライアントを使用
  // TODO: 認証実装後はgetSupabaseServerClient()に変更し、RLSでアクセス制御
  const supabase = getSupabaseServiceRoleClient();

  // スラッグから元のブランド名を復元（大文字統一）
  const decodedName = slug.toUpperCase().replace(/-/g, ' ');

  // RLSによるアクセス制御を利用して、該当ブランドのレコードが存在するかチェック
  const { count, error } = await supabase
    .from('sales')
    .select('brand', { count: 'exact', head: true })
    .eq('brand', decodedName);

  if (error) {
    console.error('Error checking brand access:', error);
    throw error;
  }

  return count !== null && count > 0;
}