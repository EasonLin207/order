import React from 'react';
import { LayoutGrid, LayoutDashboard, User } from 'lucide-react';
import { AppMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, mode, setMode }) => {
  return (
    <div className="min-h-screen bg-warm flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b-4 border-primary px-4 sm:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg">
            <LayoutGrid size={24} strokeWidth={3} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            訂餐系統
            <span className={`ml-2 text-xs sm:text-lg font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${
              mode === 'admin' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
            }`}>
              {mode === 'admin' ? 'Admin' : 'Order'}
            </span>
          </h1>
        </div>

        <div className="flex gap-2 sm:gap-4 items-center">
          {window.location.search.includes('admin=true') && (
            <button
              onClick={() => setMode(mode === 'admin' ? 'customer' : 'admin')}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold transition-all border-2 ${
                mode === 'admin' 
                  ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' 
                  : 'bg-secondary text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px]'
              }`}
            >
              {mode === 'admin' ? <User size={18} /> : <LayoutDashboard size={18} />}
              <span className="hidden sm:inline">{mode === 'admin' ? '切換至點餐' : '後台管理'}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>

      <footer className="p-8 text-center text-slate-400 font-bold text-sm">
        {/* Footer info removed as requested */}
      </footer>
    </div>
  );
};
