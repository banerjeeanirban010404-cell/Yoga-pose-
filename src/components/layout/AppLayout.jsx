import React from 'react';
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <div>
        {/* Dynamic Glowing Mesh Background */}
        <div className="mesh-bg" />

        {/* Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Subtle Footer */}
      <footer className="w-full py-8 text-center text-xs text-slate-600 border-t border-white/5 bg-[#05070f]/40 backdrop-blur-sm mt-12">
        <p>© 2026 PranaAI. Designed for physical mindfulness. Artificial Intelligence simulator.</p>
      </footer>
    </div>
  );
}
