'use client';

import {useEffect} from 'react';
import {ArrowLeft} from 'lucide-react';

import {Link} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {buttonVariants} from '@/components/ui/button';
import {usePageTitle} from './page-title';

export function PageHeader({
  title,
  subtitle,
  description,
  status,
  actions,
  backLink,
  className
}: {
  title: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  className?: string;
}) {
  const supportingText = subtitle ?? description;

  // Publish the page title so the topbar renders it. The big <h1> that used to
  // live here moved into the header (Renato 2026-09-09).
  const setPageTitle = usePageTitle()?.setTitle;
  useEffect(() => {
    setPageTitle?.(title);
  }, [title, setPageTitle]);

  // Without the title, the card is only worth rendering when it still carries a
  // subtitle, a status or actions. The back-link stays above it regardless.
  const hasCard = Boolean(supportingText || status || actions);

  if (!backLink && !hasCard) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {backLink ? (
        <Link
          href={backLink.href}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'w-fit gap-2 px-0 text-muted-foreground hover:bg-transparent'
          })}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLink.label}
        </Link>
      ) : null}

      {hasCard ? (
        <div className="rounded-xl border border-border/80 bg-card px-4 py-4 shadow-sm shadow-black/[0.03] sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            {supportingText ? (
              <div className="max-w-3xl min-w-0 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                {supportingText}
              </div>
            ) : (
              <div />
            )}

            {status || actions ? (
              <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                {status ? (
                  <div className="flex flex-wrap items-center gap-2">{status}</div>
                ) : null}
                {actions ? (
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {actions}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
