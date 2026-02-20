// Vercel Serverless Function to create Yoco checkout sessions
// This keeps the Yoco secret key secure on the server side

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    try {
        const body = await request.json();
        const {
            merchantId,
            amount,
            currency = 'ZAR',
            successUrl,
            cancelUrl,
            failureUrl,
            metadata,
            lineItems,
            customerEmail,
            customerName,
            customerPhone
        } = body;

        // Validate required fields
        if (!merchantId) {
            return new Response(
                JSON.stringify({ error: 'Merchant ID is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        if (!amount || amount <= 0) {
            return new Response(
                JSON.stringify({ error: 'Valid amount is required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        // Fetch merchant's Yoco secret key from database
        const { data: merchant, error: fetchError } = await supabase
            .from('merchants')
            .select('yoco_secret_key, name, slug')
            .eq('id', merchantId)
            .single();

        if (fetchError || !merchant) {
            console.error('Error fetching merchant:', fetchError);
            return new Response(
                JSON.stringify({ error: 'Merchant not found' }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        if (!merchant.yoco_secret_key) {
            return new Response(
                JSON.stringify({ error: 'Yoco payment gateway not configured for this merchant' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        // Generate a unique reference for this checkout
        const clientReferenceId = `${merchant.slug}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Build the Yoco checkout request payload
        const checkoutPayload = {
            amount: Math.round(amount), // Amount in cents
            currency: currency,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
            failureUrl: failureUrl,
            clientReferenceId: clientReferenceId,
            metadata: {
                ...metadata,
                merchantId: merchantId,
                customerEmail: customerEmail,
                customerName: customerName,
                customerPhone: customerPhone,
            },
        };

        // Add line items if provided
        if (lineItems && lineItems.length > 0) {
            checkoutPayload.lineItems = lineItems.map(item => ({
                displayName: item.title || item.displayName,
                quantity: item.quantity,
                pricingDetails: {
                    price: Math.round(item.price * 100), // Convert to cents
                },
                description: item.description || null,
            }));

            // Calculate totals for display
            const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            checkoutPayload.subtotalAmount = Math.round(subtotal * 100);
        }

        // Call Yoco Checkout API
        const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${merchant.yoco_secret_key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutPayload),
        });

        if (!yocoResponse.ok) {
            const errorData = await yocoResponse.json().catch(() => ({}));
            console.error('Yoco API error:', yocoResponse.status, errorData);
            return new Response(
                JSON.stringify({
                    error: 'Failed to create Yoco checkout session',
                    details: errorData
                }),
                {
                    status: yocoResponse.status,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        const yocoData = await yocoResponse.json();

        // Return the checkout session data
        return new Response(
            JSON.stringify({
                success: true,
                checkoutId: yocoData.id,
                redirectUrl: yocoData.redirectUrl,
                status: yocoData.status,
                clientReferenceId: clientReferenceId,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );

    } catch (error) {
        console.error('Error creating Yoco checkout:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
