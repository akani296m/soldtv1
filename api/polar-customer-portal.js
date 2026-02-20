// Express.js Polar Customer Portal Handler for Fly.io
// Redirects merchants to Polar customer portal to manage subscriptions

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/polar-customer-portal
router.get('/polar-customer-portal', async (req, res) => {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    const server = process.env.POLAR_ENVIRONMENT || 'sandbox';
    const returnUrl = process.env.POLAR_RETURN_URL;

    // Get merchant ID from query params
    const merchantId = req.query.merchantId;

    if (!accessToken) {
        return res.status(500).json({ error: 'Polar access token not configured' });
    }

    if (!merchantId) {
        return res.status(400).json({ error: 'Merchant ID is required' });
    }

    try {
        // Fetch merchant's Polar customer ID from database
        const { data: merchant, error: fetchError } = await supabase
            .from('merchants')
            .select('polar_customer_id, email, name')
            .eq('id', merchantId)
            .single();

        if (fetchError || !merchant) {
            console.error('Error fetching merchant:', fetchError);
            return res.status(404).json({ error: 'Merchant not found' });
        }

        if (!merchant.polar_customer_id) {
            return res.status(400).json({
                error: 'No subscription found. Please subscribe first.',
                code: 'NO_SUBSCRIPTION'
            });
        }

        // Determine API base URL
        const apiBaseUrl = server === 'production'
            ? 'https://api.polar.sh'
            : 'https://sandbox-api.polar.sh';

        // Create customer portal session
        const response = await fetch(`${apiBaseUrl}/v1/customer-portal/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_id: merchant.polar_customer_id,
                return_url: returnUrl || `${req.protocol}://${req.get('host')}`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Polar API error:', response.status, errorData);
            return res.status(response.status).json({
                error: 'Failed to create customer portal session',
                details: errorData
            });
        }

        const portalData = await response.json();

        // Redirect to customer portal
        res.redirect(302, portalData.url);

    } catch (error) {
        console.error('Error creating customer portal session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
