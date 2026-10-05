'use client';

import {createContext, useContext, useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Bug, Sparkles, TrendingUp} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {
  CHANGELOG,
  LATEST_VERSION,
  localizedChange,
  type ChangeType
} from '@/lib/changelog';

const SEEN_KEY = 'pultrum:changelog-seen';

const WhatsNewContext = createContext<{open: () => void}>({open: () => {}});

export function useWhatsNew() {
  return useContext(WhatsNewContext);
}

/**
 * Shows the "What's New" dialog automatically the first time a user loads the
 * app after a release they haven't seen (tracked per browser in localStorage),
 * and exposes open() so the sidebar version stamp can reopen it anytime.
 */
export function WhatsNewProvider({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!LATEST_VERSION) return;
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (seen !== LATEST_VERSION) {
        setOpen(true);
        localStorage.setItem(SEEN_KEY, LATEST_VERSION);
      }
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(SEEN_KEY, LATEST_VERSION);
      } catch {
        // ignore
      }
    }
  }

  return (
    <WhatsNewContext.Provider value={{open: () => setOpen(true)}}>
      {children}
      <WhatsNewDialog open={open} onOpenChange={handleOpenChange} />
    </WhatsNewContext.Provider>
  );
}

const typeMeta: Record<
  ChangeType,
  {icon: React.ComponentType<{className?: string}>; badge: string}
> = {
  feature: {
    icon: Sparkles,
    badge:
      'border-violet-300/80 bg-violet-100 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-200'
  },
  improvement: {
    icon: TrendingUp,
    badge:
      'border-sky-300/80 bg-sky-100 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-200'
  },
  fix: {
    icon: Bug,
    badge:
      'border-emerald-300/80 bg-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
};

function WhatsNewDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useTranslations('whatsNew');
  const locale = useLocale();

  const dateFmt = new Intl.DateTimeFormat(locale, {dateStyle: 'long'});
  const typeOrder: ChangeType[] = ['feature', 'improvement', 'fix'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[70vh] space-y-6 overflow-y-auto px-1 py-1">
          {CHANGELOG.map((entry) => {
            const grouped = typeOrder
              .map((type) => ({
                type,
                items: entry.changes.filter((c) => c.type === type)
              }))
              .filter((g) => g.items.length > 0);

            return (
              <section key={entry.version} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2 border-b pb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {dateFmt.format(new Date(`${entry.date}T00:00:00`))}
                  </span>
                </div>

                {grouped.map((group) => {
                  const Meta = typeMeta[group.type];
                  const Icon = Meta.icon;
                  return (
                    <div key={group.type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('gap-1 text-[11px]', Meta.badge)}
                        >
                          <Icon className="h-3 w-3" />
                          {t(`types.${group.type}`)}
                        </Badge>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {group.items.map((item, idx) => (
                          <li
                            key={`${group.type}:${idx}`}
                            className="flex gap-2 text-sm text-foreground"
                          >
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                            <span className="[overflow-wrap:anywhere]">
                              {localizedChange(item.text, locale)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
