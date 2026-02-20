import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Pause, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminMerchant } from '../../context/adminMerchantContext';
import { useAuth } from '../../context/authContext';

export default function DangerZone() {
    const { merchantId, merchant } = useAdminMerchant();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const isPaused = merchant?.status === 'paused';

    const handlePauseStore = async () => {
        setIsProcessing(true);
        setError('');

        try {
            const newStatus = isPaused ? 'active' : 'paused';

            const { error: updateError } = await supabase
                .from('merchants')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', merchantId);

            if (updateError) throw updateError;

            // Close modal and show success
            setIsPauseModalOpen(false);
            alert(isPaused ? 'Store has been reactivated!' : 'Store has been paused successfully.');

            // Refresh the page to update merchant context
            window.location.reload();
        } catch (err) {
            console.error('Error updating store status:', err);
            setError('Failed to update store status. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteStore = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // Delete merchant record (cascade will handle related records if configured)
            const { error: deleteError } = await supabase
                .from('merchants')
                .delete()
                .eq('id', merchantId);

            if (deleteError) throw deleteError;

            // Sign out user
            await supabase.auth.signOut();

            // Redirect to signup page
            navigate('/signup');
        } catch (err) {
            console.error('Error deleting store:', err);
            setError('Failed to delete store. Please contact support.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl">
            {/* Page Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Danger Zone</h2>
                <p className="text-gray-600">
                    Irreversible and destructive actions for your store
                </p>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-semibold text-red-900 mb-1">Proceed with caution</h3>
                    <p className="text-sm text-red-700">
                        The actions on this page can have serious consequences. Please make sure you understand what you're doing before proceeding.
                    </p>
                </div>
            </div>

            {/* Pause Store Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Pause size={20} className="text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isPaused ? 'Reactivate Store' : 'Pause Store'}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                            {isPaused
                                ? 'Your store is currently paused. Reactivate it to make it accessible to customers again.'
                                : 'Temporarily disable your store. Your store will be inaccessible to customers, but all data will be preserved.'
                            }
                        </p>
                        {isPaused && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                                <Pause size={14} />
                                Store is currently paused
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsPauseModalOpen(true)}
                        className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${isPaused
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                    >
                        {isPaused ? 'Reactivate' : 'Pause Store'}
                    </button>
                </div>
            </div>

            {/* Delete Store Section */}
            <div className="bg-white border border-red-300 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Trash2 size={20} className="text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Delete Store</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                            Permanently delete your store and all associated data. This action cannot be undone.
                        </p>
                        <p className="text-sm text-red-600 font-medium mt-2">
                            ⚠️ This will delete all products, orders, customers, and settings.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        Delete Store
                    </button>
                </div>
            </div>

            {/* Pause Modal */}
            {isPauseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaused ? 'bg-green-100' : 'bg-orange-100'
                                    }`}>
                                    <Pause size={24} className={isPaused ? 'text-green-600' : 'text-orange-600'} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {isPaused ? 'Reactivate Store?' : 'Pause Store?'}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPauseModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            {isPaused
                                ? 'Your store will become accessible to customers again. All products and pages will be visible.'
                                : 'Your store will be temporarily inaccessible to customers. You can reactivate it at any time.'
                            }
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPauseModalOpen(false)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePauseStore}
                                disabled={isProcessing}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${isPaused
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                    }`}
                            >
                                {isProcessing ? 'Processing...' : isPaused ? 'Reactivate' : 'Pause'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Delete Store?</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setConfirmText('');
                                    setError('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-800 font-medium mb-2">
                                ⚠️ This action cannot be undone!
                            </p>
                            <p className="text-sm text-red-700">
                                All of your store data including products, orders, customers, and settings will be permanently deleted.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="font-bold text-red-600">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => {
                                    setConfirmText(e.target.value);
                                    setError('');
                                }}
                                placeholder="DELETE"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setConfirmText('');
                                    setError('');
                                }}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteStore}
                                disabled={isProcessing || confirmText !== 'DELETE'}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
