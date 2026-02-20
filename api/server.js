// Main Express Server for Fly.io
// Handles all Polar payment API endpoints

import express from 'express';
import cors from 'cors';

// Import route handlers
import polarWebhook from './polar-webhook.js';
import polarCheckout from './polar-checkout.js';
import polarCustomerPortal from './polar-customer-portal.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Polar API Server Running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Mount Polar API routes
app.use('/api', polarWebhook);
app.use('/api', polarCheckout);
app.use('/api', polarCustomerPortal);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Polar API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.POLAR_ENVIRONMENT || 'sandbox'}`);
});

export default app;
