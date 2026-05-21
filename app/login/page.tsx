'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registered = searchParams.get('registered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(t('login.error.bad'));
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(t('login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border-dark-glass-border">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('login.title')}</h1>
        <p className="text-gray-400">{t('login.subtitle')}</p>
      </div>

      {registered && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-6 text-sm">
          {t('login.success')}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">{t('login.user.label')}</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
            placeholder={t('login.user.placeholder')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">{t('login.pass.label')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
            placeholder={t('login.pass.placeholder')}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 bg-brand-primary hover:bg-brand-primary/90 text-white py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login.button')}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        {t('login.noaccount')}{' '}
        <Link href="/register" className="text-brand-accent hover:text-brand-secondary transition-colors font-medium">
          {t('login.register')}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex justify-center items-center overflow-y-auto">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-brand-primary" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
