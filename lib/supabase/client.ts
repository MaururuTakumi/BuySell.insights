'use client';

import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/config/env-public';

// TODO: Replace `Database` with generated Supabase types.
type Database = unknown;

function createBrowserSupabaseClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}

let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }

  return browserClient;
}
