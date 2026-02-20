import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { richTextToHtml } from '../lib/richText';

// --- Mock Data (Fallback) ---
const MOCK_PRODUCT = {
  title: "PRODUCT TITLE",
  price: 1500.00,
  rating: 4,
  description: "This is the main description area. Based on your wireframe, this is a large block intended for general product details.",
  images: ["Image 1", "Image 2", "Image 3", "Image 4", "Image 5"],
  tabs: [
    { id: '1', title: 'PRODUCT TAB 1', content: 'Details for tab 1 go here.' },
    { id: '2', title: 'PRODUCT TAB 2', content: 'Details for tab 2 go here.' },
    { id: '3', title: 'PRODUCT TAB 3', content: 'Details for tab 3 go here.' },
  ]
};

export default function ProductPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product || MOCK_PRODUCT;
  const descriptionHtml = richTextToHtml(product?.description);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openTabId, setOpenTabId] = useState(null);

  // --- Handlers ---
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const toggleTab = (id) => {
    setOpenTabId(openTabId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto pt-6 px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          aria-label="Go back to previous page"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Editor
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 font-sans text-gray-800">
        
        {/* 1. HEADER (LOGO) */}
        <header className="flex justify-center py-6 mb-8 border-b border-gray-200">
          <h1 className="text-xl font-bold tracking-widest uppercase">LOGO</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* 2. LEFT COLUMN: MEDIA GALLERY */}
          <div className="space-y-4">
            
            {/* Main Image Stage */}
            <div className="relative w-full aspect-[4/5] bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center overflow-hidden">
              {/* Left Arrow */}
              <button
                onClick={handlePrevImage}
                className="absolute left-4 p-2 bg-white/80 rounded-full hover:bg-white transition shadow-sm z-10"
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Image Display */}
              {typeof product.images[activeImageIndex] === 'string' && product.images[activeImageIndex].startsWith('blob:') ? (
                <img 
                  src={product.images[activeImageIndex]} 
                  alt={`${product.title} - view ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-400 select-none">
                  {product.images[activeImageIndex]}
                </span>
              )}

              {/* Right Arrow */}
              <button
                onClick={handleNextImage}
                className="absolute right-4 p-2 bg-white/80 rounded-full hover:bg-white transition shadow-sm z-10"
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square border-2 flex items-center justify-center bg-gray-50 rounded transition-all
                    ${activeImageIndex === idx ? 'border-black ring-1 ring-black' : 'border-gray-300 hover:border-gray-400'}
                  `}
                  aria-label={`View image ${idx + 1}`}
                >
                  {typeof img === 'string' && img.startsWith('blob:') ? (
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">{img}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. RIGHT COLUMN: PRODUCT INFO */}
          <div className="flex flex-col space-y-6">
            
            {/* Title, Price, Stars */}
            <div>
              <h2 className="text-3xl font-bold mb-2">{product.title}</h2>
              <p className="text-xl font-medium mb-2">
                R {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </p>
              
              {/* Star Rating */}
              <div className="flex items-center space-x-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    width="20" 
                    height="20" 
                    fill={i < (product.rating || 0) ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  ({(product.rating || 0).toFixed(1)})
                </span>
              </div>
            </div>

            {/* Description Box */}
            <div className="p-6 border-2 border-red-200 rounded-lg min-h-[150px] bg-white">
              <h3 className="text-sm font-bold text-red-400 mb-2 uppercase">Description</h3>
              {descriptionHtml ? (
                <div
                  className="text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a:hover]:underline [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">No description available.</p>
              )}
            </div>

            {/* Tabs / Accordions */}
            {product.tabs && product.tabs.length > 0 && (
              <div className="space-y-2 border-t pt-6">
                {product.tabs.map((tab) => (
                  <div key={tab.id} className="border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => toggleTab(tab.id)}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition"
                      aria-expanded={openTabId === tab.id}
                    >
                      <span className="font-semibold uppercase text-sm tracking-wide">{tab.title}</span>
                      {/* Chevron Icon */}
                      <svg
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`transform transition-transform duration-200 ${openTabId === tab.id ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    
                    {/* Collapsible Content */}
                    {openTabId === tab.id && (
                      <div className="p-4 border-t border-gray-200 bg-white text-gray-600 text-sm leading-relaxed">
                        {tab.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart Button */}
            <button 
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition rounded"
              aria-label="Add product to cart"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
