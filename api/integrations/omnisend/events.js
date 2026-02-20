import { createHash } from 'node:crypto';
import { getServiceSupabase } from '../../_lib/supabase.js';
import {
    getBearerToken,
    isAllowedOrigin,
    jsonResponse,
    parseRetryAfterMs,
    verifyStorefrontToken,
} from '../../_lib/storefront-auth.js';

const supabase = getServiceSupabase();
const OMNISEND_EVENTS_ENDPOINT = 'https://api.omnisend.com/v5/events';

const EVENT_ALIASES = {
    added_to_cart: 'added product to cart',
    add_to_cart: 'added product to cart',
    added_product_to_cart: 'added product to cart',
    checkout_started: 'started checkout',
    started_checkout: 'started checkout',
    order_placed: 'placed order',
    placed_order: 'placed order',
    order_paid: 'paid for order',
    paid_for_order: 'paid for order',
    order_refunded: 'order refunded',
    order_fulfilled: 'order fulfilled',
    order_canceled: 'order canceled',
    product_viewed: 'viewed product',
    viewed_product: 'viewed product',
};

const ORDER_EVENT_NAMES = new Set([
    'placed order',
    'paid for order',
    'order refunded',
    'order fulfilled',
    'order canceled',
]);

const TRANSIENT_HTTP_STATUS = new Set([429, 500, 502, 503, 504]);

function toCleanObject(value) {
    if (value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        const cleanedArray = value
            .map((item) => toCleanObject(item))
            .filter((item) => item !== undefined);
        return cleanedArray;
    }

    if (typeof value === 'object') {
        const cleaned = Object.entries(value).reduce((acc, [key, entryValue]) => {
            const normalized = toCleanObject(entryValue);
            if (normalized !== undefined) {
                acc[key] = normalized;
            }
            return acc;
        }, {});
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }

    return value;
}

function normalizeEventName(name) {
    if (!name || typeof name !== 'string') return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    const aliasKey = trimmed.toLowerCase().replace(/\s+/g, '_');
    return EVENT_ALIASES[aliasKey] || trimmed;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashValue(value) {
    return createHash('sha256').update(String(value)).digest('hex');
}

function maskEmail(value) {
    if (!value || typeof value !== 'string') return undefined;
    const email = value.trim().toLowerCase();
    const [localPart = '', domain = ''] = email.split('@');
    if (!domain) return `${email.slice(0, 2)}***`;
    return `${localPart.slice(0, 2)}***@${domain}`;
}

function maskPhone(value) {
    if (!value || typeof value !== 'string') return undefined;
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return `***${digits}`;
    return `***${digits.slice(-4)}`;
}

function looksLikeEmail(value) {
    return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
}

function looksLikePhone(value) {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7;
}

function redactPII(value, keyName = '') {
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
        return value.map((item) => redactPII(item, keyName));
    }

    if (typeof value === 'object') {
        const result = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            result[key] = redactPII(nestedValue, key);
        }
        return result;
    }

    if (typeof value !== 'string') return value;

    const lowerKey = keyName.toLowerCase();
    if (lowerKey.includes('email')) {
        return {
            masked: maskEmail(value),
            hash: hashValue(value).slice(0, 16),
        };
    }

    if (lowerKey.includes('phone')) {
        return {
            masked: maskPhone(value),
        };
    }

    if (looksLikeEmail(value)) {
        return {
            masked: maskEmail(value),
            hash: hashValue(value).slice(0, 16),
        };
    }

    if (looksLikePhone(value)) {
        return {
            masked: maskPhone(value),
        };
    }

    return value;
}

function redactRequestPayload(payload) {
    if (!payload) return payload;

    const redacted = redactPII(payload);

    if (redacted?.contact?.email && typeof redacted.contact.email === 'string') {
        redacted.contact.email = {
            masked: maskEmail(redacted.contact.email),
            hash: hashValue(redacted.contact.email).slice(0, 16),
        };
    }

    if (redacted?.contact?.phone && typeof redacted.contact.phone === 'string') {
        redacted.contact.phone = {
            masked: maskPhone(redacted.contact.phone),
        };
    }

    return redacted;
}

function buildLegacyEventId(eventName, contact, properties) {
    const seed = JSON.stringify({
        eventName,
        contact: {
            id: contact?.id || null,
            email: contact?.email || null,
            phone: contact?.phone || null,
        },
        properties: properties || {},
    });
    return `legacy:${eventName}:${hashValue(seed).slice(0, 24)}`;
}

function buildEventPayload(body = {}) {
    const eventName = normalizeEventName(body.name || body.eventName);
    if (!eventName) {
        return { error: 'Event name is required' };
    }

    const contact = toCleanObject({
        id: body.contact?.id || body.contactId,
        email: body.contact?.email || body.email,
        phone: body.contact?.phone || body.phone,
        firstName: body.contact?.firstName || body.firstName,
        lastName: body.contact?.lastName || body.lastName,
    }) || {};

    const hasContactIdentifier = Boolean(contact.id || contact.email || contact.phone);
    const properties = toCleanObject(body.properties || {}) || {};

    const eventID = body.eventID || body.eventId || buildLegacyEventId(eventName, contact, properties);
    const payload = toCleanObject({
        eventName,
        eventID,
        eventTime: body.eventTime || new Date().toISOString(),
        origin: body.origin || 'api',
        eventVersion: body.eventVersion !== undefined
            ? body.eventVersion
            : (ORDER_EVENT_NAMES.has(eventName) ? 'v2' : undefined),
        contact,
        properties,
    });

    if (!hasContactIdentifier) {
        return { payload, skippedMissingIdentity: true };
    }

    return { payload };
}

async function insertLog({
    merchantId,
    name,
    statusCode,
    requestPayload,
    responsePayload,
}) {
    if (!supabase || !merchantId) return;

    try {
        await supabase.from('integrations_omnisend_logs').insert({
            merchant_id: merchantId,
            direction: 'outbound',
            kind: 'event',
            name,
            status_code: statusCode,
            request: redactRequestPayload(requestPayload),
            response: toCleanObject(responsePayload),
        });
    } catch (error) {
        console.error('[Omnisend] Failed to write log row', error);
    }
}

async function updateIntegrationState(merchantId, updates) {
    if (!supabase || !merchantId) return;

    try {
        await supabase
            .from('integrations_omnisend')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('merchant_id', merchantId);
    } catch (error) {
        console.error('[Omnisend] Failed to update integration state', error);
    }
}

async function tryInsertDedupe(merchantId, payload) {
    const { error } = await supabase
        .from('integrations_omnisend_dedupe')
        .insert({
            merchant_id: merchantId,
            event_id: payload.eventID,
            event_name: payload.eventName,
        });

    if (!error) return { deduped: false };

    if (error.code === '23505') {
        return { deduped: true };
    }

    throw error;
}

async function sendOmnisendEventWithRetry({ apiKey, payload }) {
    let attempt = 0;

    while (attempt < 2) {
        const response = await fetch(OMNISEND_EVENTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (attempt === 0 && response.status === 429) {
            const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
            const delay = Math.min(retryAfterMs || 1000, 2000);
            await sleep(delay);
            attempt += 1;
            continue;
        }

        if (attempt === 0 && response.status >= 500) {
            const jitterMs = 300 + Math.floor(Math.random() * 501);
            await sleep(jitterMs);
            attempt += 1;
            continue;
        }

        return response;
    }

    return fetch(OMNISEND_EVENTS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        },
        body: JSON.stringify(payload),
    });
}

export default async function handler(request) {
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

    const authToken = getBearerToken(request.headers.get('authorization'));
    if (!authToken) {
        return jsonResponse(401, { error: 'Missing storefront session token' }, allowedOrigin);
    }

    const tokenResult = await verifyStorefrontToken(authToken);
    if (!tokenResult.valid) {
        return jsonResponse(401, { error: tokenResult.error || 'Invalid storefront token' }, allowedOrigin);
    }

    if (tokenResult.payload.origin && tokenResult.payload.origin !== origin) {
        return jsonResponse(401, { error: 'Token origin mismatch' }, allowedOrigin);
    }

    const merchantId = tokenResult.payload.merchant_id;

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse(400, { error: 'Invalid JSON body' }, allowedOrigin);
    }

    const { payload, error: payloadError, skippedMissingIdentity } = buildEventPayload(body);
    if (payloadError) {
        return jsonResponse(400, { error: payloadError }, allowedOrigin);
    }

    if (skippedMissingIdentity) {
        await insertLog({
            merchantId,
            name: payload.eventName,
            statusCode: 202,
            requestPayload: payload,
            responsePayload: { skipped: true, reason: 'missing_identity' },
        });
        return jsonResponse(
            202,
            {
                success: true,
                skipped: true,
                reason: 'skipped_missing_identity',
            },
            allowedOrigin
        );
    }

    const { data: integration, error: integrationError } = await supabase
        .from('integrations_omnisend')
        .select('status, api_key, api_key_enc')
        .eq('merchant_id', merchantId)
        .maybeSingle();

    if (integrationError) {
        console.error('[Omnisend] Failed to load integration', integrationError);
        return jsonResponse(500, { error: 'Failed to load Omnisend integration' }, allowedOrigin);
    }

    if (!integration || integration.status !== 'connected') {
        return jsonResponse(409, { error: 'Omnisend integration is not connected' }, allowedOrigin);
    }

    const apiKey = (integration.api_key || integration.api_key_enc || '').trim();
    if (!apiKey) {
        return jsonResponse(409, { error: 'Omnisend API key missing' }, allowedOrigin);
    }

    try {
        const dedupeResult = await tryInsertDedupe(merchantId, payload);
        if (dedupeResult.deduped) {
            await insertLog({
                merchantId,
                name: payload.eventName,
                statusCode: 208,
                requestPayload: payload,
                responsePayload: { deduped: true },
            });
            return jsonResponse(
                200,
                {
                    success: true,
                    deduped: true,
                    eventID: payload.eventID,
                },
                allowedOrigin
            );
        }
    } catch (dedupeError) {
        console.error('[Omnisend] Dedupe insert failed', dedupeError);
        return jsonResponse(500, { error: 'Failed to process dedupe state' }, allowedOrigin);
    }

    let omnisendStatus = 500;
    let omnisendBody = {};

    try {
        const omnisendResponse = await sendOmnisendEventWithRetry({ apiKey, payload });
        omnisendStatus = omnisendResponse.status;

        const responseText = await omnisendResponse.text();
        try {
            omnisendBody = responseText ? JSON.parse(responseText) : {};
        } catch {
            omnisendBody = { raw: responseText };
        }

        await insertLog({
            merchantId,
            name: payload.eventName,
            statusCode: omnisendStatus,
            requestPayload: payload,
            responsePayload: omnisendBody,
        });

        if (omnisendResponse.ok) {
            await updateIntegrationState(merchantId, {
                status: 'connected',
                last_error: null,
                last_error_at: null,
                last_event_at: new Date().toISOString(),
            });

            return jsonResponse(
                200,
                {
                    success: true,
                    status: omnisendStatus,
                    response: omnisendBody,
                },
                allowedOrigin
            );
        }

        const isAuthError = omnisendStatus === 401 || omnisendStatus === 403;
        const isTransient = TRANSIENT_HTTP_STATUS.has(omnisendStatus);

        if (isAuthError) {
            await updateIntegrationState(merchantId, {
                status: 'error',
                last_error: 'AUTH',
                last_error_at: new Date().toISOString(),
            });
        } else if (isTransient) {
            await updateIntegrationState(merchantId, {
                status: 'connected',
                last_error: `HTTP ${omnisendStatus}`,
                last_error_at: new Date().toISOString(),
            });
        } else {
            await updateIntegrationState(merchantId, {
                status: 'connected',
                last_error: `HTTP ${omnisendStatus}`,
                last_error_at: new Date().toISOString(),
            });
        }

        return jsonResponse(
            502,
            {
                success: false,
                status: omnisendStatus,
                error: omnisendBody,
            },
            allowedOrigin
        );
    } catch (error) {
        console.error('[Omnisend] Event forward error', error);

        await insertLog({
            merchantId,
            name: payload.eventName,
            statusCode: omnisendStatus,
            requestPayload: payload,
            responsePayload: { error: error.message },
        });

        await updateIntegrationState(merchantId, {
            status: 'connected',
            last_error: error.message,
            last_error_at: new Date().toISOString(),
        });

        return jsonResponse(
            500,
            {
                success: false,
                error: 'Failed to forward event to Omnisend',
            },
            allowedOrigin
        );
    }
}
