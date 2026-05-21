'use client';

import { useT } from '@/lib/i18n/context';

export default function T({ id }: { id: string }) {
  const t = useT();
  return <>{t(id)}</>;
}
