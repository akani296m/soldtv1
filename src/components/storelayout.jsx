import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { User, Search } from 'lucide-react';
import { useCart } from '../context/cartcontext';

export default function StoreLayout() {
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">

      {/* --- STORE NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/store" className="text-xl font-bold tracking-widest uppercase">
            BRAND<span className="text-gray-400">.</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link to="/store" className="hover:text-gray-500 transition">Home</Link>
            <Link to="/store/prou" className="hover:text-gray-500 transition">Catalog</Link>
            <Link to="/store/about" className="hover:text-gray-500 transition">About</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6">
            <button className="hover:text-gray-500"><Search size={20} /></button>
            <Link to="/store/cart" className="hover:text-gray-500 relative">
              <img src="/assets/icons/cart.svg" alt="Cart" className="w-5 h-5" />
              {/* Dynamic Cart Badge */}
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* --- PAGE CONTENT GOES HERE --- */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* --- STORE FOOTER --- */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h4 className="font-bold mb-4">BRAND.</h4>
            <p className="text-sm text-gray-500">Redefining modern commerce.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/store/catalog">New Arrivals</Link></li>
              <li><Link to="/store/catalog">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="#">FAQ</Link></li>
              <li><Link to="#">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-white border p-2 w-full text-sm" />
              <button className="bg-black text-white px-4 text-sm">Join</button>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400">
          © 2024 Brand Store. All rights reserved.
        </div>
      </footer>

    </div>
  );
}