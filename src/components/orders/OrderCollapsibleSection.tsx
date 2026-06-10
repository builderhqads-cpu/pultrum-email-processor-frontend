'use client';

import {useState} from 'react';
import {ChevronDown} from 'lucide-react';

import {cn} from '@/lib/utils';

export function OrderCollapsibleSection({
  title,
  description,
  badge,
  defaultOpen = false,
  className,
  children
}: {
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn('rounded-xl border bg-background', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description ? (
            <div className="mt-1 text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open ? <div className="border-t px-4 py-4">{children}</div> : null}
    </section>
  );
}
