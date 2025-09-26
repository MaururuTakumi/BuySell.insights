'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PasswordProtectProps {
  children: React.ReactNode;
}

export default function PasswordProtect({ children }: PasswordProtectProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // セッションストレージから認証状態を確認
    const authStatus = sessionStorage.getItem('buysell_auth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // パスワード検証
    if (password === 'YamashitaKouen') {
      sessionStorage.setItem('buysell_auth', 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('パスワードが正しくありません');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('buysell_auth');
    setIsAuthenticated(false);
    setPassword('');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                BuySell Insights
              </h1>
              <p className="text-sm text-gray-600">
                認証が必要です
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="パスワードを入力"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                ログイン
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                このサイトは機密情報を含みます。
                <br />
                権限のない方のアクセスは禁止されています。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ログアウトボタンを右上に配置 */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          ログアウト
        </button>
      </div>
      {children}
    </>
  );
}