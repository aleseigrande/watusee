'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, dateOfBirth }),
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.error || t('register.error.generic'));
      }
    } catch (err) {
      setError(t('register.error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex justify-center items-center overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border-dark-glass-border">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('register.title')}</h1>
          <p className="text-gray-400">{t('register.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t('register.user.label')}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
              placeholder={t('register.user.placeholder')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t('register.email.label')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
              placeholder={t('register.email.placeholder')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t('register.dob.label')}</label>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">{t('register.pass.label')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
              placeholder={t('register.pass.placeholder')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('register.button')}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          {t('register.hasaccount')}{' '}
          <Link href="/login" className="text-brand-accent hover:text-brand-secondary transition-colors font-medium">
            {t('register.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
