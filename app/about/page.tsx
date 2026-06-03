'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/context';
import { Loader2, Sparkles, Eye, Heart, Gamepad2, Share2, Radio, Compass, Send, Users, Image, PenTool, BookOpen } from 'lucide-react';

export default function AboutPage() {
  const t = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.ok && r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4 sm:px-6">
      {/* Hero */}
      <section className="relative max-w-4xl mx-auto text-center mb-20 sm:mb-32">
        <div className="absolute inset-0 flex justify-center pointer-events-none overflow-hidden">
          <div className="w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[120px]" />
        </div>
        <div className="relative">
          <div className="flex justify-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse delay-150" />
            <Sparkles className="w-5 h-5 text-brand-primary animate-pulse delay-300" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {t('about.hero.title')}
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Concept */}
      <section className="max-w-3xl mx-auto mb-20 sm:mb-32">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-dark-glass-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-brand-primary/10 blur-[80px]" />
          <Eye className="w-10 h-10 text-brand-primary mb-6" />
          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
            {t('about.concept')}
          </p>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="max-w-5xl mx-auto mb-20 sm:mb-32">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10 sm:mb-14">
          {t('about.pillars.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-brand-primary/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
              <Compass className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('about.pillars.create.title')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('about.pillars.create.desc')}</p>
          </div>
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-brand-secondary/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center mb-4 group-hover:bg-brand-secondary/20 transition-colors">
              <Gamepad2 className="w-6 h-6 text-brand-secondary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('about.pillars.play.title')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('about.pillars.play.desc')}</p>
          </div>
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-green-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
              <Share2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('about.pillars.share.title')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('about.pillars.share.desc')}</p>
          </div>
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-glass-border hover:border-purple-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <Radio className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('about.pillars.resonance.title')}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{t('about.pillars.resonance.desc')}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="max-w-4xl mx-auto mb-20 sm:mb-32">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10 sm:mb-14">
            {t('about.stats.title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-dark-glass-border text-center">
              <Users className="w-6 h-6 text-brand-primary mx-auto mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.users}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('about.stats.users')}</p>
            </div>
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-dark-glass-border text-center">
              <Image className="w-6 h-6 text-brand-secondary mx-auto mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.imagesUploaded}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('about.stats.imagesUploaded')}</p>
            </div>
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-dark-glass-border text-center">
              <PenTool className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.imagesInterpreted}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('about.stats.imagesInterpreted')}</p>
            </div>
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-dark-glass-border text-center">
              <Gamepad2 className="w-6 h-6 text-purple-400 mx-auto mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-white">{stats.gamesPlayed}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('about.stats.gamesPlayed')}</p>
            </div>
          </div>
        </section>
      )}

      {/* Community */}
      <section className="max-w-3xl mx-auto mb-20 sm:mb-32">
        <div className="text-center">
          <Heart className="w-10 h-10 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{t('about.community.title')}</h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            {t('about.community.desc')}
          </p>
          <p className="text-white text-2xl sm:text-3xl font-bold mt-12 mb-8">{t('about.cta')}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="WatUSee" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-3xl sm:text-4xl font-bold tracking-tighter text-gradient">— WatUsee —</p>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-lg mx-auto" id="contact">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-dark-glass-border">
          <Send className="w-8 h-8 text-brand-primary mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{t('about.contact.title')}</h2>
          <p className="text-gray-400 text-sm mb-8">{t('about.contact.desc')}</p>

          {status === 'success' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm text-center">
              {t('about.contact.success')}
            </div>
          ) : (
            <form onSubmit={handleContact} className="flex flex-col gap-4">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('about.contact.name')}
                className="bg-black/50 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('about.contact.email')}
                className="bg-black/50 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm"
              />
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('about.contact.message')}
                className="bg-black/50 border border-dark-glass-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors text-sm resize-none"
              />
              {status === 'error' && (
                <p className="text-red-400 text-xs">{t('about.contact.error')}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? t('about.contact.sending') : t('about.contact.send')}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
