import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // APIルートへのアクセスを保護
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 認証トークンの確認
    const authHeader = request.headers.get('x-auth-token');

    // 環境変数からAPIキーを取得（本番環境では環境変数に設定）
    const apiKey = process.env.API_SECRET_KEY || 'YamashitaKouen-API-2024';

    if (authHeader !== apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
};