// Polar Checkout Redirect Handler (Fly.io)
// GET /api/polar-checkout

import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/polar-checkout", async (req, res) => {
    try {
        // --------------------
        // Required env vars
        // --------------------
        const {
            POLAR_ACCESS_TOKEN,
            POLAR_ENVIRONMENT,
            POLAR_SUCCESS_URL,
            POLAR_RETURN_URL,
        } = process.env;

        if (!POLAR_ACCESS_TOKEN) {
            throw new Error("POLAR_ACCESS_TOKEN not set");
        }

        if (!POLAR_ENVIRONMENT) {
            throw new Error("POLAR_ENVIRONMENT not set (sandbox | production)");
        }

        // --------------------
        // Query params
        // --------------------
        const {
            productPriceId,
            customerExternalId,
            customerEmail,
            customerName,
            metadata,
        } = req.query;

        if (!productPriceId) {
            return res.status(400).send("Missing ?productPriceId=");
        }

        // --------------------
        // Build checkout body
        // --------------------
        const checkoutBody = {
            product_price_id: productPriceId,
            success_url:
                POLAR_SUCCESS_URL ||
                `${req.protocol}://${req.get("host")}/billing/success`,
        };

        if (POLAR_RETURN_URL) {
            checkoutBody.return_url = POLAR_RETURN_URL;
        }

        if (customerExternalId) {
            checkoutBody.customer_external_id = customerExternalId;
        }

        if (customerEmail) {
            checkoutBody.customer_email = customerEmail;
        }

        if (customerName) {
            checkoutBody.customer_name = customerName;
        }

        if (metadata) {
            try {
                checkoutBody.metadata = JSON.parse(
                    decodeURIComponent(metadata)
                );
            } catch {
                return res.status(400).send("Invalid metadata JSON");
            }
        }

        // --------------------
        // Polar API base
        // --------------------
        const apiBaseUrl =
            POLAR_ENVIRONMENT === "production"
                ? "https://api.polar.sh"
                : "https://sandbox-api.polar.sh";

        // --------------------
        // Create checkout
        // --------------------
        const response = await fetch(
            `${apiBaseUrl}/v1/checkouts/custom`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutBody),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Polar checkout error:", error);
            return res.status(502).send("Failed to create checkout");
        }

        const checkout = await response.json();

        if (!checkout?.url) {
            return res.status(502).send("Invalid checkout response");
        }

        // --------------------
        // Redirect user
        // --------------------
        return res.redirect(302, checkout.url);

    } catch (err) {
        console.error("Polar checkout handler error:", err);
        return res.status(500).send("Internal server error");
    }
});

export default router;
