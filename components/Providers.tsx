'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { LangProvider } from '@/lib/i18n/context';
import type { Session } from 'next-auth';

export default function Providers({ children, session }: { children: ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <LangProvider>{children}</LangProvider>
    </SessionProvider>
  );
}
