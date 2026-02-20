import { supabase } from './supabase';

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

const CONTACT_HINT_STORAGE_KEY = 'omnisend_contact_hint_v1';
const SESSION_ID_STORAGE_KEY = 'omnisend_session_id_v1';
const CART_ID_STORAGE_KEY = 'omnisend_cart_id_v1';
const TOKEN_STORAGE_KEY = 'omnisend_storefront_token_v1';

let inMemoryToken = null;

function nowSeconds() {
    return Math.floor(Date.now() / 1000);
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function normalizeEventName(name) {
    if (!name || typeof name !== 'string') return null;

    const trimmed = name.trim();
    if (!trimmed) return null;

    const aliasKey = trimmed.toLowerCase().replace(/\s+/g, '_');
    return EVENT_ALIASES[aliasKey] || trimmed;
}

function normalizeIdComponent(value) {
    if (value === null || value === undefined) return 'na';
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .slice(0, 120) || 'na';
}

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /\S+@\S+\.\S+/.test(email.trim());
}

function simpleHash(value) {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash << 5) + hash) + value.charCodeAt(i);
        hash &= 0xffffffff;
    }
    return Math.abs(hash).toString(36);
}

function cleanObject(value) {
    if (value === null || value === undefined) return undefined;

    if (Array.isArray(value)) {
        const cleanedArray = value
            .map((item) => cleanObject(item))
            .filter((item) => item !== undefined);
        return cleanedArray;
    }

    if (typeof value === 'object') {
        const cleaned = Object.entries(value).reduce((acc, [key, entryValue]) => {
            const normalized = cleanObject(entryValue);
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

function generateStableRandomId(prefix) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}:${crypto.randomUUID()}`;
    }
    return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

function readStorageJson(key) {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function writeStorageJson(key, value) {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage failures
    }
}

function readStorageValue(key) {
    if (!isBrowser()) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorageValue(key, value) {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Ignore storage failures
    }
}

function removeStorageValue(key) {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Ignore storage failures
    }
}

function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const payloadRaw = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
        return JSON.parse(atob(payloadRaw));
    } catch {
        return null;
    }
}

function isTokenUsable(tokenRecord, merchantId) {
    if (!tokenRecord?.token || !tokenRecord?.exp) return false;
    if (tokenRecord.merchantId && merchantId && tokenRecord.merchantId !== merchantId) return false;
    return tokenRecord.exp > (nowSeconds() + 30);
}

async function fetchStorefrontSessionToken(merchantId) {
    if (!merchantId) return null;

    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }
    } catch {
        // Anonymous storefront sessions are valid.
    }

    const response = await fetch('/api/storefront/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({ merchantId }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Storefront session failed (${response.status})`);
    }

    const data = await response.json();
    const payload = decodeJwtPayload(data.token);
    const exp = payload?.exp || Math.floor(new Date(data.expiresAt).getTime() / 1000);

    const tokenRecord = {
        token: data.token,
        exp,
        merchantId: data.merchantId || merchantId,
    };

    inMemoryToken = tokenRecord;
    writeStorageJson(TOKEN_STORAGE_KEY, tokenRecord);

    return tokenRecord.token;
}

async function getOmnisendAuthToken(merchantId) {
    if (!merchantId) return null;

    if (isTokenUsable(inMemoryToken, merchantId)) {
        return inMemoryToken.token;
    }

    const stored = readStorageJson(TOKEN_STORAGE_KEY);
    if (isTokenUsable(stored, merchantId)) {
        inMemoryToken = stored;
        return stored.token;
    }

    return fetchStorefrontSessionToken(merchantId);
}

export function getOmnisendSessionId() {
    const existing = readStorageValue(SESSION_ID_STORAGE_KEY);
    if (existing) return existing;

    const created = generateStableRandomId('sess');
    writeStorageValue(SESSION_ID_STORAGE_KEY, created);
    return created;
}

export function getOmnisendCartId() {
    const existing = readStorageValue(CART_ID_STORAGE_KEY);
    if (existing) return existing;

    const created = `cart:${normalizeIdComponent(getOmnisendSessionId())}`;
    writeStorageValue(CART_ID_STORAGE_KEY, created);
    return created;
}

export function resetOmnisendCartId() {
    removeStorageValue(CART_ID_STORAGE_KEY);
}

export function buildOmnisendEventId({
    type,
    cartId,
    orderId,
    productId,
    quantity,
    minuteBucket,
    sessionId,
    statusVersion,
    refundIdOrAmount,
    seed = {},
}) {
    const normalizedType = normalizeIdComponent(type);
    const normalizedSessionId = normalizeIdComponent(sessionId || getOmnisendSessionId());
    const normalizedCartId = normalizeIdComponent(cartId || getOmnisendCartId());
    const normalizedOrderId = normalizeIdComponent(orderId);
    const normalizedProductId = normalizeIdComponent(productId);
    const normalizedQty = normalizeIdComponent(quantity);
    const normalizedMinute = normalizeIdComponent(
        minuteBucket || Math.floor(Date.now() / 60000)
    );
    const normalizedStatusVersion = normalizeIdComponent(statusVersion || '1');
    const normalizedRefund = normalizeIdComponent(refundIdOrAmount || 'na');

    switch (normalizedType) {
        case 'add_to_cart':
        case 'added_product_to_cart':
        case 'added_to_cart':
            return `atc:${normalizedCartId}:${normalizedProductId}:${normalizedQty || normalizedMinute}`;
        case 'product_viewed':
        case 'viewed_product':
            return `pv:${normalizedSessionId}:${normalizedProductId}`;
        case 'checkout_started':
        case 'started_checkout':
            return `co:${normalizedCartId}`;
        case 'order_placed':
        case 'placed_order':
            return `op:${normalizedOrderId}`;
        case 'order_paid':
        case 'paid_for_order':
            return `paid:${normalizedOrderId}`;
        case 'order_fulfilled':
            return `ful:${normalizedOrderId}:${normalizedStatusVersion}`;
        case 'order_canceled':
            return `can:${normalizedOrderId}:${normalizedStatusVersion}`;
        case 'order_refunded':
            return `ref:${normalizedOrderId}:${normalizedRefund}`;
        default: {
            const hash = simpleHash(JSON.stringify({ normalizedType, seed }));
            return `evt:${normalizedType}:${hash}`;
        }
    }
}

export function saveOmnisendContactHint(contact = {}, { requireValidEmail = false } = {}) {
    if (!isBrowser()) return;

    const sanitized = cleanObject({
        email: contact.email,
        phone: contact.phone,
        firstName: contact.firstName,
        lastName: contact.lastName,
    });

    if (!sanitized) return;

    if (sanitized.email && requireValidEmail && !isValidEmail(sanitized.email)) {
        delete sanitized.email;
    }

    if (!sanitized.email && !sanitized.phone) return;

    writeStorageJson(CONTACT_HINT_STORAGE_KEY, sanitized);
}

export function getOmnisendContactHint() {
    const parsed = readStorageJson(CONTACT_HINT_STORAGE_KEY);
    return cleanObject(parsed) || {};
}

export function buildOmnisendContact({ email, phone, firstName, lastName } = {}) {
    const cleanEmail = isValidEmail(email) ? email : undefined;
    return cleanObject({
        email: cleanEmail,
        phone,
        firstName,
        lastName,
    }) || {};
}

export function buildOmnisendLineItems(items = []) {
    return items.map((item) => cleanObject({
        productID: String(item.product_id || item.id || item.productID || ''),
        productTitle: item.title || item.productTitle || '',
        productPrice: Number(item.price || item.productPrice || 0),
        quantity: Number(item.quantity || 1),
        productImageURL: item.image || item.productImageURL,
        productDescription: item.description || item.productDescription,
        productURL: item.productURL,
        variantID: item.variant_id ? String(item.variant_id) : undefined,
        variantTitle: item.variant_title || item.variantTitle,
    })).filter(Boolean);
}

export async function trackOmnisendEvent({
    merchantId,
    name,
    contact = {},
    properties = {},
    eventID,
    eventTime,
    eventVersion,
}) {
    const normalizedEventName = normalizeEventName(name);
    if (!merchantId || !normalizedEventName) {
        return { ok: false, skipped: true, reason: 'missing merchantId or eventName' };
    }

    const mergedContact = cleanObject({
        ...getOmnisendContactHint(),
        ...contact,
    }) || {};

    const hasIdentity = Boolean(mergedContact.id || mergedContact.email || mergedContact.phone);
    if (!hasIdentity) {
        // Intentional: Omnisend identity is required; silently skip until known.
        return { ok: false, skipped: true, reason: 'missing_identity' };
    }

    const resolvedEventId = eventID || buildOmnisendEventId({
        type: normalizedEventName.replace(/\s+/g, '_'),
        seed: { properties, mergedContact },
    });

    const payload = cleanObject({
        name: normalizedEventName,
        eventID: resolvedEventId,
        eventTime: eventTime || new Date().toISOString(),
        origin: 'api',
        eventVersion: eventVersion !== undefined ? eventVersion : undefined,
        contact: mergedContact,
        properties,
    });

    try {
        const authToken = await getOmnisendAuthToken(merchantId);
        if (!authToken) {
            return { ok: false, skipped: true, reason: 'missing_auth_token' };
        }

        const response = await fetch('/api/integrations/omnisend/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const message = await response.text().catch(() => '');
            return { ok: false, status: response.status, error: message };
        }

        const data = await response.json().catch(() => ({}));
        return { ok: true, status: response.status, data };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}
