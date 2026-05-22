'use client';

import { useT } from '@/lib/i18n/context';

export default function T({ id, params }: { id: string; params?: Record<string, string> }) {
  const t = useT();
  return <>{t(id, params)}</>;
}
