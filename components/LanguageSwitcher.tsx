'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLang } from '@/lib/i18n/context';

const languages = [
  { code: 'EN' as const, labelKey: 'lang.en' },
  { code: 'ES' as const, labelKey: 'lang.es' },
  { code: 'IT' as const, labelKey: 'lang.it' },
  { code: 'ZH' as const, labelKey: 'lang.zh' },
  { code: 'KO' as const, labelKey: 'lang.ko' },
  { code: 'RU' as const, labelKey: 'lang.ru' },
];

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 text-gray-300 hover:text-brand-accent transition-colors hover-lift rounded-lg"
        aria-label={t('nav.lang')}
      >
        <Languages className="h-4 w-4" />
        <span className="text-sm font-medium">{lang}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-40 glass-panel rounded-xl border border-dark-glass-border overflow-hidden shadow-xl">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  lang === l.code
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`font-medium ${lang === l.code ? 'text-brand-primary' : ''}`}>{l.code}</span>
                <span className="text-gray-400">{t(l.labelKey)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
