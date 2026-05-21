'use client';

import { Search } from 'lucide-react';
import { useT } from '@/lib/i18n/context';

export default function SearchInput() {
  const t = useT();
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-dark-glass-border rounded-full bg-dark-surface/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm transition-all"
        placeholder={t('nav.search')}
      />
    </div>
  );
}
