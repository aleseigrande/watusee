'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { en } from './en';
import { es } from './es';
import { zh } from './zh';
import { ko } from './ko';
import { ru } from './ru';
import { it } from './it';

type Lang = 'EN' | 'ES' | 'ZH' | 'KO' | 'RU' | 'IT';

const translations: Record<Lang, Record<string, string>> = { EN: en, ES: es, ZH: zh, KO: ko, RU: ru, IT: it };

const langMap: Record<Lang, string> = { EN: 'en', ES: 'es', ZH: 'zh', KO: 'ko', RU: 'ru', IT: 'it' };

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('EN');

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langMap[l];
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const dict = translations[lang];
      let val = (dict as any)[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          val = val.replace(`{${k}}`, v);
        }
      }
      return val;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

export function useT() {
  const { t } = useLang();
  return t;
}
