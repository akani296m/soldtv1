/**
 * Load and initialize Omnisend Web Tracking
 * @param {string} brandId - The Omnisend Brand ID
 */
export function loadOmnisendPixel(brandId) {
    if (!brandId || typeof window === 'undefined') return;

    // Check if Omnisend is already loaded
    if (window.omnisend && window.omnisend.loaded) {
        console.log('Omnisend already loaded');
        return;
    }

    // Initialize Omnisend
    window.omnisend = window.omnisend || [];
    window.omnisend.push(["brandID", brandId]);
    window.omnisend.push(["track", "$pageViewed"]);

    // Load the Omnisend script
    !function () {
        var e = document.createElement("script");
        e.type = "text/javascript";
        e.async = true;
        e.src = "https://omnisnippet1.com/inshop/launcher-v2.js";
        var t = document.getElementsByTagName("script")[0];
        t.parentNode.insertBefore(e, t);
    }();

    // Mark as loaded
    window.omnisend.loaded = true;

    console.log(`Omnisend Pixel ${brandId} loaded successfully`);
}

/**
 * Track a custom Omnisend event
 * @param {string} eventName - The event name (e.g., '$productViewed', '$addedProductToCart')
 * @param {object} data - Optional event data
 */
export function trackOmnisendEvent(eventName, data = {}) {
    if (typeof window !== 'undefined' && window.omnisend) {
        window.omnisend.push(["track", eventName, data]);
    }
}

/**
 * Identify a contact in Omnisend
 * @param {object} contact - Contact data { email, phone, firstName, lastName, etc. }
 */
export function identifyOmnisendContact(contact) {
    if (typeof window !== 'undefined' && window.omnisend) {
        window.omnisend.push(["identify", contact]);
    }
}
