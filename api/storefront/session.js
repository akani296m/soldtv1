import { getServiceSupabase } from '../_lib/supabase.js';
import {
    getBearerToken,
    isAllowedOrigin,
    issueStorefrontToken,
    jsonResponse,
    resolveMerchantIdFromRequestContext,
} from '../_lib/storefront-auth.js';

export default async function handler(request) {
    const supabase = getServiceSupabase();
    if (!supabase) {
        return jsonResponse(500, { error: 'Supabase server configuration missing' });
    }

    const origin = request.headers.get('origin');
    const allowedOrigin = (await isAllowedOrigin(origin, supabase)) ? origin : null;

    if (request.method === 'OPTIONS') {
        if (!allowedOrigin) {
            return jsonResponse(403, { error: 'Origin not allowed' });
        }
        return jsonResponse(200, { ok: true }, allowedOrigin);
    }

    if (!allowedOrigin) {
        return jsonResponse(403, { error: 'Origin not allowed' });
    }

    if (request.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, allowedOrigin);
    }

    let body = {};
    try {
        body = await request.json();
    } catch {
        body = {};
    }

    const adminAccessToken = getBearerToken(request.headers.get('authorization'));
    const merchantId = await resolveMerchantIdFromRequestContext({
        request,
        supabase,
        body,
        adminAccessToken,
    });

    if (!merchantId) {
        return jsonResponse(
            401,
            { error: 'Unable to establish storefront session for merchant context' },
            allowedOrigin
        );
    }

    try {
        const { token, payload } = await issueStorefrontToken({
            merchantId,
            origin: allowedOrigin,
            expiresInSeconds: 3600,
        });

        return jsonResponse(
            200,
            {
                token,
                merchantId,
                expiresAt: new Date(payload.exp * 1000).toISOString(),
            },
            allowedOrigin
        );
    } catch (error) {
        console.error('[Omnisend] Failed to issue storefront token', error);
        return jsonResponse(500, { error: 'Unable to create storefront session token' }, allowedOrigin);
    }
}
