'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok && data.error) {
        setError(data.error);
      } else {
        setSent(true);
        if (data.resetUrl) setResetUrl(data.resetUrl);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 flex justify-center items-center overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border-dark-glass-border">
        <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('forgot.back')}</span>
        </Link>

        <div className="text-center mb-6 sm:mb-8">
          <Mail className="w-10 h-10 text-brand-primary mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('forgot.title')}</h1>
          <p className="text-gray-400 text-sm">{t('forgot.subtitle')}</p>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">{t('forgot.sent')}</p>
            <p className="text-gray-400 text-sm">{t('forgot.sentDesc')}</p>
            {resetUrl && (
              <div className="mt-4 p-3 rounded-xl bg-zinc-800 border border-dark-glass-border">
                <p className="text-xs text-gray-400 mb-2">Reset link (SMTP not configured):</p>
                <a href={resetUrl} className="text-brand-accent text-sm break-all hover:underline">{resetUrl}</a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">{t('forgot.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border border-dark-glass-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors"
                placeholder={t('forgot.emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {t('forgot.send')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
