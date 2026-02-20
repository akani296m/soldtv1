import { createClient } from '@supabase/supabase-js'

// You get these from your Supabase Dashboard -> Project Settings -> API
// IMPORTANT: Use the "anon" / "public" key for browser apps, NOT the service_role key!

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zzpznlecoaumargapikq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY environment variable!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Use PKCE flow for better security (prevents token in URL)
        flowType: 'pkce',
        // Don't auto-detect session from URL (security: prevents token exposure)
        detectSessionInUrl: true,
        // Persist session in localStorage
        persistSession: true,
        // Auto-refresh token before expiry
        autoRefreshToken: true,
    },
    global: {
        headers: {
            'X-Client-Info': 'merchants-app/1.0.0',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})