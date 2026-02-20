import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/authContext';
import { useAdminMerchant } from '../context/adminMerchantContext';
import posthog from 'posthog-js';

export default function OnboardingCard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refetch: refetchMerchant, hasMerchant, merchant } = useAdminMerchant();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    experience: '',
    productStatus: '',
    storeName: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // AI name suggestion states
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Redirect to dashboard if user already has a merchant
  useEffect(() => {
    if (hasMerchant && merchant) {
      console.log('[Onboarding] User already has merchant, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [hasMerchant, merchant, navigate]);

  const handleSelection = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Auto-advance after selection for a smooth flow
    if (step < 3) {
      setTimeout(() => setStep(step + 1), 200);
    } else if (field === 'storeName' && value.trim()) {
      // Move to completion step after store name is entered
      setStep(step + 1);
      // Automatically create the merchant after a brief moment
      setTimeout(() => createMerchant(), 500);
    }
  };

  // Generate AI store name suggestions
  const generateAINames = async () => {
    setIsLoadingAI(true);
    setAiError('');
    setAiSuggestions([]);

    try {
      const response = await fetch('/api/generate-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: formData.productStatus,
          experience: formData.experience,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate names');
      }

      const data = await response.json();
      setAiSuggestions(data.names || []);
    } catch (err) {
      console.error('Error generating AI names:', err);
      setAiError('Unable to generate suggestions. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle clicking on a suggestion
  const handleSuggestionClick = (name) => {
    setFormData({ ...formData, storeName: name });
    setAiSuggestions([]); // Hide suggestions after selection
  };

  // Generate a URL-safe slug from store name
  const generateSlug = (storeName) => {
    return storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
  };

  // Check if slug is unique and generate alternative if needed
  const getUniqueSlug = async (baseSlug) => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no merchant found with this slug, it's unique
      if (!data) {
        return slug;
      }

      // Try with a number suffix
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  const createMerchant = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.storeName.trim()) {
      setError('Please enter a store name');
      setStep(3); // Go back to store name step
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const storeName = formData.storeName.trim();
      // Generate unique slug
      const baseSlug = generateSlug(formData.storeName);
      const uniqueSlug = await getUniqueSlug(baseSlug);


      console.log('[Onboarding] Creating merchant with slug:', uniqueSlug);

      // Create merchant record
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .insert({
          name: storeName,
          store_name: formData.storeName.trim(),
          business_name: formData.storeName.trim(),
          slug: uniqueSlug,
          owner_id: user.id,
          // Store onboarding data as metadata
          onboarding_data: {
            experience: formData.experience,
            product_status: formData.productStatus,
            completed_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (merchantError) {
        console.error('[Onboarding] Error creating merchant:', merchantError);
        throw merchantError;
      }

      console.log('[Onboarding] Merchant created:', merchant.id);

      // Create merchant_users relationship
      const { error: relationError } = await supabase
        .from('merchant_users')
        .insert({
          user_id: user.id,
          merchant_id: merchant.id,
          role: 'owner'
        });

      if (relationError) {
        console.error('[Onboarding] Error creating merchant_users:', relationError);
        throw relationError;
      }

      console.log('[Onboarding] Merchant-user relationship created');

      // Track store creation event in PostHog
      posthog.capture('Store Created', {
        store_id: merchant.id,
        store_name: merchant.name,
        store_slug: merchant.slug,
        seller_experience: formData.experience,
        product_status: formData.productStatus,
      });

      // Refetch the merchant context to update hasMerchant status
      console.log('[Onboarding] Refreshing merchant context...');
      await refetchMerchant();

      // Wait a moment for context to fully update
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[Onboarding] Redirecting to dashboard...');
      // Success! Redirect to dashboard
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);

    } catch (err) {
      console.error('[Onboarding] Error:', err);
      setError(err.message || 'Failed to create merchant. Please try again.');
      setIsCreating(false);
      setStep(3); // Go back to allow retry
    }
  };

  const handleSkip = () => {
    // Skip with a basic store name
    if (!formData.storeName) {
      setFormData({ ...formData, storeName: "My Store" });
    }
    setStep(4);
    setTimeout(() => createMerchant(), 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">

      {/* CARD CONTAINER: Fixed Dimensions 796px x 375px */}
      <div
        className="relative bg-white rounded-2xl shadow-xl flex flex-col items-center justify-between py-8 px-12"
        style={{ width: '796px', height: '375px' }}
      >

        {/* --- TOP: STEPPER DOTS --- */}
        <div className="flex space-x-3 mb-6">
          {[1, 2, 3, 4].map((dotIndex) => (
            <div
              key={dotIndex}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${step === dotIndex ? 'bg-black' : 'bg-gray-300'
                }`}
            />
          ))}
        </div>

        {/* --- MIDDLE: DYNAMIC CONTENT --- */}
        <div className="w-full max-w-lg flex-grow flex flex-col justify-center">

          {/* QUESTION 1 */}
          {step === 1 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Do you have experience with selling online?</h2>
              <div className="flex justify-center gap-4">
                <OptionButton
                  label="Yes"
                  onClick={() => handleSelection('experience', 'Yes')}
                  selected={formData.experience === 'Yes'}
                />
                <OptionButton
                  label="No"
                  onClick={() => handleSelection('experience', 'No')}
                  selected={formData.experience === 'No'}
                />
              </div>
            </div>
          )}

          {/* QUESTION 2 */}
          {step === 2 && (
            <div className="animate-fade-in text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Do you know what you are going to sell?</h2>
              <div className="flex flex-col gap-3 items-center">
                <OptionButton
                  label="Yes"
                  onClick={() => handleSelection('productStatus', 'Yes')}
                  wide
                />
                <OptionButton
                  label="No, still exploring"
                  onClick={() => handleSelection('productStatus', 'No, still exploring')}
                  wide
                />
                <OptionButton
                  label="No, but I have direction"
                  onClick={() => handleSelection('productStatus', 'No, but I have direction')}
                  wide
                />
              </div>
            </div>
          )}

          {/* QUESTION 3 */}
          {step === 3 && (
            <div className="animate-fade-in w-full text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">What are you going to call your store?</h2>

              <div className="relative max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="e.g. Urban Threads"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pr-32 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  value={formData.storeName}
                  onChange={(e) => {
                    setFormData({ ...formData, storeName: e.target.value });
                    // Clear suggestions when user starts typing
                    if (aiSuggestions.length > 0) {
                      setAiSuggestions([]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.storeName.trim()) {
                      handleSelection('storeName', formData.storeName);
                    }
                  }}
                  autoFocus
                />

                {/* AI BUTTON - Connected to OpenAI */}
                <button
                  className="absolute right-2 top-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 hover:text-purple-900 text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors border border-purple-200 disabled:opacity-50 disabled:cursor-wait"
                  onClick={generateAINames}
                  disabled={isLoadingAI}
                  type="button"
                >
                  {isLoadingAI ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Let AI help me
                    </>
                  )}
                </button>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-500 mb-2">Click a name to use it:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {aiSuggestions.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(name)}
                        className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 hover:text-purple-800 transition-all transform hover:scale-105 shadow-sm"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Error */}
              {aiError && (
                <p className="mt-3 text-sm text-orange-600">{aiError}</p>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={() => formData.storeName.trim() && handleSelection('storeName', formData.storeName)}
                disabled={!formData.storeName.trim()}
                className="mt-4 bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Confirm
              </button>
            </div>
          )}

          {/* COMPLETED STATE (Step 4) */}
          {step === 4 && (
            <div className="text-center animate-fade-in">
              {isCreating ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Creating your store...</h2>
                  <p className="text-gray-500">Setting up {formData.storeName}</p>
                </>
              ) : error ? (
                <>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">✕</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-red-600">Something went wrong</h2>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                  <p className="text-gray-500">Redirecting to your dashboard...</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* --- BOTTOM: SKIP SECTION --- */}
        {step < 4 && (
          <div className="mt-auto text-center">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-black font-medium text-sm transition-colors"
            >
              Skip
            </button>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
              Straight to building
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Sub-component for options to keep code clean
const OptionButton = ({ label, onClick, wide = false, selected = false }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 border rounded-lg px-4 py-2 hover:border-black hover:bg-gray-50 transition-all group
      ${wide ? 'w-80 text-left' : 'min-w-[100px] justify-center'}
      ${selected ? 'border-black bg-gray-50' : 'border-gray-200'}
    `}
  >
    {/* Custom Checkbox Visual */}
    <div className={`
      w-4 h-4 rounded border flex items-center justify-center
      ${selected ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}
    `}>
      {selected && <div className="w-2 h-2 bg-white rounded-[1px]" />}
    </div>

    <span className="text-sm font-medium text-gray-700 group-hover:text-black">
      {label}
    </span>
  </button>
);