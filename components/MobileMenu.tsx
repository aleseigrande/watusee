'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles, PlusCircle, Image } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

interface MobileMenuProps {
  session: { user?: { name?: string | null } } | null;
}

export default function MobileMenu({ session }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-300 hover:text-white transition-colors"
        aria-label={t('mobile.menu')}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-50 glass-panel border-b border-dark-glass-border p-4 flex flex-col gap-2 animate-in slide-in-from-top duration-200">
            <Link
              href="/play"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Sparkles className="h-5 w-5 text-brand-accent" />
              <span className="font-medium">{t('nav.games')}</span>
            </Link>
            <Link
              href="/imaginarium"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Sparkles className="h-5 w-5 text-brand-accent" />
              <span className="font-medium">{t('nav.imaginarium')}</span>
            </Link>
            <Link
              href="/create"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <PlusCircle className="h-5 w-5 text-brand-primary" />
              <span className="font-medium">{t('mobile.create')}</span>
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Image className="h-5 w-5 text-brand-accent" />
              <span className="font-medium">{t('about.nav')}</span>
            </Link>
            <div className="h-px bg-dark-glass-border my-2" />
            {session?.user ? (
              <>
                <Link
                  href="/my-creations"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Image className="h-5 w-5 text-brand-accent" />
                  <span className="font-medium">{t('nav.mycreations')}</span>
                </Link>
                <div className="px-4 py-2 text-sm text-gray-400">
                  <span className="text-white font-medium">{session.user.name}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-gray-300 hover:text-white py-2 text-sm font-medium transition-colors"
                >
                  {t('mobile.login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="bg-brand-primary text-white px-4 py-2.5 rounded-full text-sm font-medium text-center transition-colors"
                >
                  {t('mobile.register')}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
