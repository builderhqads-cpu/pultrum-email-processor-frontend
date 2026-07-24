'use client';

import {ChevronLeft, ChevronRight} from 'lucide-react';
import {useLocale} from 'next-intl';

import type {Locale} from '@/i18n/routing';
import {Button} from '@/components/ui/button';

/**
 * Client-side pager for lists that are already fully loaded. Filtering and
 * search stay instant (they run over the whole set); this only bounds how many
 * rows are rendered and, crucially, makes the rows past the first page
 * reachable at all.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const locale = useLocale() as Locale;
  const labels = paginationLabels[locale] ?? paginationLabels.en;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  // A single page needs no controls.
  if (total <= pageSize) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2">
      <div className="text-xs text-muted-foreground">
        {labels.range(from, to, total)}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          {labels.previous}
        </Button>
        <span className="text-xs text-muted-foreground">
          {labels.page(current, pageCount)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
        >
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const paginationLabels: Record<
  Locale,
  {
    range: (from: number, to: number, total: number) => string;
    page: (current: number, count: number) => string;
    previous: string;
    next: string;
  }
> = {
  pt: {
    range: (from, to, total) => `${from}-${to} de ${total}`,
    page: (current, count) => `Pagina ${current} de ${count}`,
    previous: 'Anterior',
    next: 'Proxima'
  },
  en: {
    range: (from, to, total) => `${from}-${to} of ${total}`,
    page: (current, count) => `Page ${current} of ${count}`,
    previous: 'Previous',
    next: 'Next'
  },
  nl: {
    range: (from, to, total) => `${from}-${to} van ${total}`,
    page: (current, count) => `Pagina ${current} van ${count}`,
    previous: 'Vorige',
    next: 'Volgende'
  }
};
