'use client';

import { ReactNode } from 'react';
import { LangProvider } from '@/lib/i18n/context';

export default function Providers({ children }: { children: ReactNode }) {
  return <LangProvider>{children}</LangProvider>;
}
