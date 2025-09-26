import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import type { Database } from './types';

export function getSupabaseServiceRoleClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  const mutableCookies = cookieStore as unknown as {
    set?: (name: string, value: string, options?: Record<string, unknown>) => void;
  };

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (typeof mutableCookies.set !== 'function') {
            return;
          }

          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookies.set?.(name, value, options);
          });
        },
      },
      cookieOptions: {
        name: 'sb:token',
      },
      // TODO: Supabase Auth 統合時に next/headers の headers() から Authorization ヘッダーを読み取り、サーバー側でも JWT を評価する。
    },
  );
}
