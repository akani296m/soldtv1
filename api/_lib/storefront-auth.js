const env = globalThis?.process?.env || {};

const ADMIN_DOMAINS = [
    'merchants.io',
    'www.merchants.io',
    'soldt.co.za',
    'www.soldt.co.za',
    'myshop.soldt.co.za',
    'localhost',
    '127.0.0.1',
];

const TOKEN_AUDIENCE = 'storefront';
const TOKEN_ISSUER = 'soldt-omnisend';
const JWT_SECRET =
    env.OMNISEND_STOREFRONT_JWT_SECRET ||
    env.STOREFRONT_SESSION_SECRET ||
    env.OMNISEND_JWT_SECRET;

let signingKeyPromise = null;

function isAdminDomain(hostname) {
    return ADMIN_DOMAINS.includes(hostname);
}

function normalizeHostname(value) {
    if (!value) return null;
    return value.trim().toLowerCase();
}

function parseUrl(value) {
    if (!value) return null;
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function extractSlugFromPath(pathname) {
    if (!pathname) return null;
    const match = pathname.match(/^\/s\/([^/]+)/i);
    return match ? decodeURIComponent(match[1]) : null;
}

async function getSigningKey() {
    if (!JWT_SECRET) return null;
    if (!signingKeyPromise) {
        signingKeyPromise = crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );
    }
    return signingKeyPromise;
}

function base64UrlEncode(input) {
    const BufferRef = globalThis.Buffer;
    if (!BufferRef) throw new Error('Buffer is not available');
    const buffer = BufferRef.from(input);
    return buffer
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(input) {
    const BufferRef = globalThis.Buffer;
    if (!BufferRef) throw new Error('Buffer is not available');
    const normalized = input
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(input.length / 4) * 4, '=');
    return BufferRef.from(normalized, 'base64').toString('utf8');
}

function parseRetryAfterSeconds(value) {
    if (!value) return null;
    const asInt = parseInt(value, 10);
    if (Number.isFinite(asInt)) return asInt;
    const dateValue = new Date(value).getTime();
    if (Number.isNaN(dateValue)) return null;
    const diffSeconds = Math.ceil((dateValue - Date.now()) / 1000);
    return Number.isFinite(diffSeconds) ? diffSeconds : null;
}

export function getBearerToken(value) {
    if (!value || typeof value !== 'string') return null;
    const [scheme, token] = value.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
    return token;
}

export function getCorsHeaders(allowedOrigin) {
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
        Vary: 'Origin',
    };

    if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
    }

    return headers;
}

export function jsonResponse(status, payload, allowedOrigin = null) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: getCorsHeaders(allowedOrigin),
    });
}

export async function isAllowedOrigin(origin, supabase) {
    const originUrl = parseUrl(origin);
    if (!originUrl) return false;

    const hostname = normalizeHostname(originUrl.hostname);
    if (!hostname) return false;

    if (isAdminDomain(hostname)) return true;

    if (!supabase) return false;
    const { data, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('custom_domain', hostname)
        .maybeSingle();

    if (error) {
        return false;
    }

    return Boolean(data?.id);
}

async function resolveMerchantBySlug(supabase, slug) {
    if (!slug) return null;
    const { data, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (error || !data?.id) return null;
    return data.id;
}

async function resolveMerchantByDomain(supabase, hostname) {
    if (!hostname) return null;
    const { data, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('custom_domain', hostname)
        .maybeSingle();

    if (error || !data?.id) return null;
    return data.id;
}

async function verifyAdminMerchantAccess({ supabase, merchantId, adminAccessToken }) {
    if (!merchantId || !adminAccessToken) return false;

    const { data: authData, error: authError } = await supabase.auth.getUser(adminAccessToken);
    if (authError || !authData?.user?.id) return false;

    const userId = authData.user.id;

    const { data: memberData } = await supabase
        .from('merchant_users')
        .select('merchant_id')
        .eq('merchant_id', merchantId)
        .eq('user_id', userId)
        .maybeSingle();

    if (memberData?.merchant_id) return true;

    const { data: ownerData } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', merchantId)
        .eq('owner_id', userId)
        .maybeSingle();

    return Boolean(ownerData?.id);
}

export async function resolveMerchantIdFromRequestContext({
    request,
    supabase,
    body = {},
    adminAccessToken = null,
}) {
    const refererUrl = parseUrl(request.headers.get('referer'));
    const originUrl = parseUrl(request.headers.get('origin'));

    const refererHost = normalizeHostname(refererUrl?.hostname);
    const originHost = normalizeHostname(originUrl?.hostname);

    // 1) Storefront on admin domain: derive slug from /s/:slug
    if (refererHost && isAdminDomain(refererHost)) {
        const slug = extractSlugFromPath(refererUrl?.pathname);
        const merchantId = await resolveMerchantBySlug(supabase, slug);
        if (merchantId) return merchantId;
    }

    // 2) Storefront on custom domain: derive from domain
    if (refererHost && !isAdminDomain(refererHost)) {
        const merchantId = await resolveMerchantByDomain(supabase, refererHost);
        if (merchantId) return merchantId;
    }

    if (originHost && !isAdminDomain(originHost)) {
        const merchantId = await resolveMerchantByDomain(supabase, originHost);
        if (merchantId) return merchantId;
    }

    // 3) Admin fallback: verify user has access to merchantId before minting token
    const merchantIdCandidate = body.merchantId || body.merchant_id || null;
    if (merchantIdCandidate) {
        const hasAccess = await verifyAdminMerchantAccess({
            supabase,
            merchantId: merchantIdCandidate,
            adminAccessToken,
        });
        if (hasAccess) return merchantIdCandidate;
    }

    return null;
}

export async function issueStorefrontToken({
    merchantId,
    origin = null,
    expiresInSeconds = 3600,
}) {
    const key = await getSigningKey();
    if (!key) {
        throw new Error('Missing OMNISEND_STOREFRONT_JWT_SECRET');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: TOKEN_ISSUER,
        aud: TOKEN_AUDIENCE,
        sub: merchantId,
        merchant_id: merchantId,
        iat: now,
        exp: now + expiresInSeconds,
    };

    if (origin) {
        payload.origin = origin;
    }

    const headerEncoded = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerEncoded}.${payloadEncoded}`;

    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(signingInput)
    );

    const signatureEncoded = base64UrlEncode(signatureBuffer);
    return {
        token: `${signingInput}.${signatureEncoded}`,
        payload,
    };
}

export async function verifyStorefrontToken(token) {
    if (!token || typeof token !== 'string') return { valid: false, error: 'Missing token' };

    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token' };

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const key = await getSigningKey();
    if (!key) return { valid: false, error: 'Missing JWT secret' };

    let header;
    let payload;
    try {
        header = JSON.parse(base64UrlDecode(headerEncoded));
        payload = JSON.parse(base64UrlDecode(payloadEncoded));
    } catch {
        return { valid: false, error: 'Invalid token encoding' };
    }

    if (header?.alg !== 'HS256') return { valid: false, error: 'Invalid token alg' };

    const signingInput = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(signingInput)
    );
    const expectedSignature = base64UrlEncode(expectedSignatureBuffer);

    if (signatureEncoded !== expectedSignature) {
        return { valid: false, error: 'Invalid token signature' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload?.aud !== TOKEN_AUDIENCE) {
        return { valid: false, error: 'Invalid token audience' };
    }

    if (payload?.iss !== TOKEN_ISSUER) {
        return { valid: false, error: 'Invalid token issuer' };
    }

    if (!payload?.merchant_id) {
        return { valid: false, error: 'Missing merchant claim' };
    }

    if (!payload?.exp || payload.exp <= now) {
        return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
}

export function parseRetryAfterMs(value) {
    const seconds = parseRetryAfterSeconds(value);
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    return seconds * 1000;
}
