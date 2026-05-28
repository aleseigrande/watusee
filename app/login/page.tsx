'use client';

import { useState, Suspense, useEffect } from 'react';
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
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(d => setOauthProviders(d.providers))
      .catch(() => {});
  }, []);

  const registered = searchParams.get('registered');
  const oauthError = searchParams.get('error') === 'oauth';
  const noEmailError = searchParams.get('error') === 'no_email';

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
        if (res.error === 'CredentialsSignin') {
          setError(t('login.error.bad'));
        } else {
          setError(t('login.error.generic') + ' (' + res.error + ')');
        }
      } else if (res?.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(t('login.error.generic'));
      }
    } catch (e) {
      console.error('Login error:', e);
      setError(t('login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setError('');
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch {
      setError(t('oauth.error'));
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

      {(oauthError || noEmailError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
          {t('oauth.error')}
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

      {oauthProviders.length > 0 && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-glass-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a2e] px-3 text-gray-400">{t('oauth.or')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {oauthProviders.includes('google') && (
              <button
                onClick={() => handleOAuth('google')}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 rounded-full font-medium flex items-center justify-center gap-3 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('oauth.google')}
              </button>
            )}
            {oauthProviders.includes('facebook') && (
              <button
                onClick={() => handleOAuth('facebook')}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-3 rounded-full font-medium flex items-center justify-center gap-3 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {t('oauth.facebook')}
              </button>
            )}
          </div>
        </>
      )}

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
