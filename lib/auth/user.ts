/**
 * 認証・ユーザー管理モジュール
 *
 * 将来的にSupabase Authと統合予定です。
 * 現在はBrandGateでRLSベースのアクセス制御を行っているため、
 * このモジュールは使用されていません。
 */

// 将来の実装のための型定義を維持
export type CurrentUser = {
  id: string;
  email?: string;
  brandCodes: string[];
};
