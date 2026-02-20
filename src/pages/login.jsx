import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signIn, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the page user was trying to access
    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message || 'Invalid email or password');
            setIsLoading(false);
        } else {
            // Navigation will happen automatically via useEffect
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4" style={{ backgroundColor: '#F0F4F8' }}>
            <div className="w-full max-w-md">
                {/* Logo Lockup */}
                <div className="mb-10">
                    <div className="flex items-center gap-3">
                        <img src="/LOGOMAIN.svg" alt="SOLDT" className="h-10" />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-lg p-14" style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)' }}>
                    {/* Page Headline */}
                    <h1 className="text-3xl font-bold mb-8" style={{ color: '#111827' }}>
                        Login to your account
                    </h1>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                                Email <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 transition-all"
                                style={{
                                    borderColor: '#D1D5DB',
                                    borderRadius: '8px',
                                    height: '48px',
                                    color: '#111827',
                                    focusRingColor: '#2563EB'
                                }}
                                placeholder="Enter your email"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                                Password <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-3 pr-11 text-base focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        borderColor: '#D1D5DB',
                                        borderRadius: '8px',
                                        height: '48px',
                                        color: '#111827'
                                    }}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: '#9CA3AF' }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm" style={{ color: '#EF4444' }}>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: '#2563EB',
                                height: '48px',
                                borderRadius: '8px'
                            }}
                        >
                            {isLoading ? 'Loading...' : 'Continue'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
                            <span className="text-sm" style={{ color: '#6B7280' }}>Or continue with</span>
                            <div className="flex-1 h-px" style={{ backgroundColor: '#D1D5DB' }}></div>
                        </div>

                        {/* Social Authentication */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="border rounded-lg flex items-center justify-center transition-colors hover:bg-gray-50"
                                style={{
                                    borderColor: '#D1D5DB',
                                    height: '48px',
                                    borderRadius: '8px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10.2V12.05H15.5818C15.3273 13.3 14.5636 14.3591 13.4182 15.0682V17.5773H16.7364C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4" />
                                    <path d="M10.2 20C12.9 20 15.1636 19.1045 16.7364 17.5773L13.4182 15.0682C12.4636 15.6682 11.2364 16.0227 10.2 16.0227C7.59091 16.0227 5.38182 14.2636 4.54091 11.9H1.09545V14.4909C2.65909 17.5909 6.19091 20 10.2 20Z" fill="#34A853" />
                                    <path d="M4.54091 11.9C4.32273 11.3 4.2 10.6591 4.2 10C4.2 9.34091 4.32273 8.7 4.54091 8.1V5.50909H1.09545C0.4 6.85909 0 8.38636 0 10C0 11.6136 0.4 13.1409 1.09545 14.4909L4.54091 11.9Z" fill="#FBBC05" />
                                    <path d="M10.2 3.97727C11.3364 3.97727 12.3545 4.35909 13.1545 5.12727L16.0636 2.21818C15.1591 1.38636 12.9 0 10.2 0C6.19091 0 2.65909 2.40909 1.09545 5.50909L4.54091 8.1C5.38182 5.73636 7.59091 3.97727 10.2 3.97727Z" fill="#EA4335" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="border rounded-lg flex items-center justify-center transition-colors hover:bg-gray-50"
                                style={{
                                    borderColor: '#D1D5DB',
                                    height: '48px',
                                    borderRadius: '8px',
                                    backgroundColor: 'white'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15.625 10.625C15.625 10.2917 15.5971 9.95833 15.5417 9.625H10V11.5417H13.1458C12.9792 12.4167 12.4583 13.1667 11.6875 13.6458V14.9583H13.7292C14.8542 13.9167 15.625 12.3958 15.625 10.625Z" fill="black" />
                                    <path d="M10 16.25C11.5625 16.25 12.875 15.7708 13.7292 14.9583L11.6875 13.6458C11.0417 14.0625 10.2083 14.3125 10 14.3125C8.47917 14.3125 7.1875 13.25 6.6875 11.8542H4.55208V13.2292C5.41667 14.9167 7.5625 16.25 10 16.25Z" fill="black" />
                                    <path d="M6.6875 11.8542C6.39583 11.0417 6.39583 10.1667 6.6875 9.35417V7.97917H4.55208C3.64583 9.77083 3.64583 11.8542 4.55208 13.2292L6.6875 11.8542Z" fill="black" />
                                    <path d="M10 5.6875C10.7292 5.6875 11.4167 5.95833 11.9583 6.45833L13.7708 4.64583C12.8333 3.77083 11.5417 3.33333 10 3.33333C7.5625 3.33333 5.41667 4.66667 4.55208 6.35417L6.6875 7.72917C7.1875 6.33333 8.47917 5.6875 10 5.6875Z" fill="black" />
                                </svg>
                            </button>
                        </div>

                        {/* Footer Links */}
                        <div className="text-center text-sm mt-8" style={{ color: '#6B7280' }}>
                            <Link to="/forgot-password" className="hover:underline" style={{ color: '#2563EB' }}>
                                Forgot password?
                            </Link>
                            <span className="mx-2" style={{ color: '#D1D5DB' }}>|</span>
                            <span>Don't have an account yet? </span>
                            <Link to="/signup" className="hover:underline" style={{ color: '#2563EB' }}>
                                Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
