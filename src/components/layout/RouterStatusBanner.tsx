'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {AlertTriangle, X} from 'lucide-react';

import {useAiStatus} from '@/hooks/use-ai-status';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';

/**
 * Global "AI router degraded" banner (Renato 2026-10-05). The AI Status page
 * already detects incidents (status === 'incident'); this surfaces that on
 * every page so planners immediately know WHY processing is stuck, instead of
 * seeing silent failures — the pain from the router-timeout incident. Auto-hides
 * on recovery (the status refetches every 60s); dismissible per incident.
 */
export function RouterStatusBanner({locale}: {locale: Locale}) {
  const t = useTranslations('routerStatus');
  const {data} = useAiStatus();
  const [dismissedSince, setDismissedSince] = useState<string | null>(null);

  const incident = data?.status === 'incident';
  const since = data?.ongoingSince ?? null;
  if (!incident) return null;
  // Keep the dismiss scoped to THIS incident: a new incident (different
  // ongoingSince) shows the banner again.
  if (since && dismissedSince === since) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-medium">{t('title')}</span>{' '}
        <span className="text-amber-800/90 dark:text-amber-200/80">{t('body')}</span>
      </div>
      <Link
        href="/ai-status"
        locale={locale}
        className="shrink-0 font-medium underline underline-offset-2 hover:no-underline"
      >
        {t('viewDetails')}
      </Link>
      <button
        type="button"
        onClick={() => setDismissedSince(since)}
        aria-label={t('dismiss')}
        title={t('dismiss')}
        className="shrink-0 rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
