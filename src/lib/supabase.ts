import { createBrowserClient } from '@supabase/ssr'

// 클라이언트 사이드용 (브라우저에서만 사용)
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit', // PKCE 대신 implicit flow 사용
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      }
    }
  )
}
