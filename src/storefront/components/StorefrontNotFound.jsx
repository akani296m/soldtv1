import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, Search } from 'lucide-react';

/**
 * 404 page for when a merchant storefront is not found
 */
export default function StorefrontNotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-8">
                    <Store className="text-gray-400" size={48} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Store Not Found
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Sorry, we couldn't find the store you're looking for.
                    It may have been moved, deleted, or the URL might be incorrect.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>

                {/* Help Text */}
                <p className="mt-12 text-sm text-gray-500">
                    If you believe this is an error, please contact support.
                </p>
            </div>
        </div>
    );
}
