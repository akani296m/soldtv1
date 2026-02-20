import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAdminMerchant } from '../../context/adminMerchantContext';

export default function BillingSuccess() {
    const navigate = useNavigate();
    const { merchant, refetch } = useAdminMerchant();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Refetch merchant data to get updated subscription info
        refetch();

        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/settings/billing');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [refetch, navigate]);

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: '#F7F7F5' }}
        >
            <div
                className="bg-white rounded-2xl p-12 text-center"
                style={{
                    maxWidth: '500px',
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
                }}
            >
                {/* Success Icon */}
                <div className="mb-6 flex justify-center">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: '#F0F9FF' }}
                    >
                        <CheckCircle size={48} style={{ color: '#3B82F6' }} />
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-3xl font-bold mb-3" style={{ color: '#111' }}>
                    Payment Successful!
                </h1>
                <p className="text-base mb-6" style={{ color: '#666' }}>
                    Thank you for subscribing. Your account has been upgraded and you now have access to all premium features.
                </p>

                {/* Subscription Info */}
                {merchant?.subscription_plan && (
                    <div
                        className="mb-8 p-4 rounded-lg"
                        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
                    >
                        <p className="text-sm font-medium mb-1" style={{ color: '#666' }}>
                            Your Plan
                        </p>
                        <p className="text-xl font-bold capitalize" style={{ color: '#111' }}>
                            {merchant.subscription_plan}
                        </p>
                    </div>
                )}

                {/* Redirect Info */}
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#888' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Redirecting to billing in {countdown} seconds...</span>
                </div>

                {/* Manual Navigation */}
                <button
                    onClick={() => navigate('/settings/billing')}
                    className="mt-6 px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                    style={{
                        background: '#3B82F6',
                        color: 'white',
                    }}
                >
                    Go to Billing Now
                </button>
            </div>
        </div>
    );
}
