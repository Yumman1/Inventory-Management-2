import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  error: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSignup, error }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Email and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch {
      setLocalError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password || !name.trim()) {
      setLocalError('Name, email and password are required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await onSignup(email.trim(), password, name.trim());
    } catch (err: any) {
      setLocalError(err?.message || 'Could not create account. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200/80 p-12">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl">
              <FlaskConical size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">ScentVault</h1>
          <p className="text-slate-500 text-center text-sm font-bold mb-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
          {mode === 'login' && (
            <p className="text-slate-400 text-center text-xs mb-8">Use the email and password provided by your administrator</p>
          )}

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setLocalError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setLocalError(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${mode === 'signup' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              {err && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">{err}</div>}
              <button type="submit" disabled={submitting} className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed">
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              {err && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">{err}</div>}
              <button type="submit" disabled={submitting} className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed">
                {submitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
