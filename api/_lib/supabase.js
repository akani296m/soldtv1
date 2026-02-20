import { createClient } from '@supabase/supabase-js';

const env = globalThis?.process?.env || {};
const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

let serviceClient = null;

export function getServiceSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }

    if (!serviceClient) {
        serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    return serviceClient;
}
