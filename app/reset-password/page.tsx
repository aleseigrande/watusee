'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

function ResetForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{t('reset.invalid')}</p>
        <Link href="/forgot-password" className="text-brand-accent hover:text-brand-secondary transition-colors font-medium">
          {t('reset.request')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('reset.minLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('reset.mismatch'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setDone(true);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <p className="text-white font-semibold mb-2">{t('reset.done')}</p>
        <Link href="/login" className="text-brand-accent hover:text-brand-secondary transition-colors font-medium">
          {t('reset.login')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">{t('reset.newPassword')}</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors w-full pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">{t('reset.confirm')}</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {t('reset.button')}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useT();
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex justify-center items-center overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border-dark-glass-border">
        <div className="text-center mb-6 sm:mb-8">
          <Lock className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('reset.title')}</h1>
          <p className="text-gray-400 text-sm">{t('reset.subtitle')}</p>
        </div>

        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
