'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { en } from './en';
import { es } from './es';
import { zh } from './zh';
import { ko } from './ko';
import { ru } from './ru';

type Lang = 'EN' | 'ES' | 'ZH' | 'KO' | 'RU';

const translations: Record<Lang, Record<string, string>> = { EN: en, ES: es, ZH: zh, KO: ko, RU: ru };

const langMap: Record<Lang, string> = { EN: 'en', ES: 'es', ZH: 'zh', KO: 'ko', RU: 'ru' };

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
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
    (key: string): string => {
      const dict = translations[lang];
      return (dict as any)[key] ?? key;
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
