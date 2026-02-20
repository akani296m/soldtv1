import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar'; // Your existing Sidebar component

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#F6F6F7]">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full md:w-auto pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}