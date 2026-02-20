/**
 * Load and initialize Meta (Facebook) Pixel
 * @param {string} pixelId - The Meta Pixel ID
 */
export function loadMetaPixel(pixelId) {
    if (!pixelId || typeof window === 'undefined') return;

    // Check if pixel is already loaded
    if (window.fbq) {
        console.log('Meta Pixel already loaded');
        return;
    }

    // Initialize Meta Pixel
    !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
    );

    // Initialize with the pixel ID
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    console.log(`Meta Pixel ${pixelId} loaded successfully`);
}

/**
 * Track a custom Meta Pixel event
 * @param {string} eventName - The event name (e.g., 'AddToCart', 'Purchase')
 * @param {object} data - Optional event data
 */
export function trackMetaEvent(eventName, data = {}) {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, data);
    }
}
