# Service Role Keyの取得方法

## 手順

1. Supabaseダッシュボードにアクセス
   - URL: https://supabase.com/dashboard/project/gteownghgieerkmojomf/settings/api

2. 「Project API keys」セクションを確認

3. 「service_role」キーをコピー
   - 注意: このキーは**絶対に公開しないでください**
   - サーバーサイドでのみ使用します

4. `.env.local`ファイルに追加
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...（実際のキーをここに貼り付け）
   ```

## セキュリティ注意事項

- Service Role Keyは完全な管理者権限を持っています
- RLS（Row Level Security）をバイパスします
- GitHubなどのバージョン管理システムにコミットしないでください
- `.env.local`は`.gitignore`に含まれていることを確認してください

## 現在の設定

- **Project URL**: https://gteownghgieerkmojomf.supabase.co
- **Anon Key**: 設定済み（.env.localに記載）
- **Service Role Key**: **手動で取得・設定が必要**