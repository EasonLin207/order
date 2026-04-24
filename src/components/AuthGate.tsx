import React, { useState } from 'react';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('密碼錯誤，請再試一次。');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-md mx-auto pt-10 sm:pt-20">
      <div className="brutal-card bg-slate-900 text-white text-center border-slate-900">
        <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-12 border-4 border-white shadow-lg">
          <Lock size={32} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-black mb-2">後台存取授權</h2>
        <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">需要管理員密碼</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-left">
            <label className="block text-xs font-black mb-2 uppercase tracking-wide text-primary">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 text-center text-2xl tracking-[0.5em] font-black border-4 border-slate-900 rounded-xl focus:ring-0 focus:border-primary transition-colors bg-white text-slate-900 shadow-inner"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 justify-center text-red-400 font-bold text-sm bg-red-400/10 py-2 rounded-lg border border-red-400/20">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-primary text-white border-4 border-white font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(255,107,53,0.3)] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 active:shadow-none"
          >
            <LogIn size={20} strokeWidth={3} />
            授權登入
          </button>
        </form>
        
        <div className="mt-8 text-slate-500 text-[10px] font-bold">
          TIP: DEFAULT PASSWORD IS <span className="text-primary font-black">admin123</span>
        </div>
      </div>
    </div>
  );
};
