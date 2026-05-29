'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { FilmStrip, CircleNotch } from '@phosphor-icons/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true);
    setError(null);

    let authError;
    if (action === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      authError = error;
    }

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] px-4 font-inter">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-[#18181b] border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
            <FilmStrip size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">RenderDaemon</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">Sign in to your account</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-3 text-center">
              <span className="text-xs text-[#f87171] font-medium">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#d4d4d8]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#d4d4d8]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => handleAuth('login')}
              disabled={loading || !email || !password}
              className="w-full bg-white text-black text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <CircleNotch className="animate-spin" size={16} /> : 'Sign In'}
            </button>
            <button
              onClick={() => handleAuth('signup')}
              disabled={loading || !email || !password}
              className="w-full bg-transparent text-white border border-white/10 text-sm font-medium py-2.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Create Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
