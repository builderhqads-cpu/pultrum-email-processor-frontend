'use client';

import {AppSidebar} from './AppSidebar';
import {PageTitleProvider} from './page-title';
import {AppTopbar} from './AppTopbar';
import type {Locale} from '@/i18n/routing';
import {usePathname, useRouter} from '@/i18n/navigation';
import {useEffect, useMemo} from 'react';
import {useAuth} from '@/hooks/use-auth';
import {useTranslations} from 'next-intl';

export function AppLayout({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const {status} = useAuth();
  const t = useTranslations();

  const isPublicRoute = useMemo(
    () =>
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/reset-password',
    [pathname]
  );

  useEffect(() => {
    if (isPublicRoute) return;
    if (status === 'unauthenticated') {
      router.replace('/login', {locale});
    }
  }, [isPublicRoute, status, router, locale]);

  if (!isPublicRoute && status === 'loading') {
    return (
      <div className="min-h-screen overflow-x-hidden bg-muted/40">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <div className="w-full rounded-xl border bg-background p-6 text-sm text-muted-foreground">
            {t('common.loading')}
          </div>
        </div>
      </div>
    );
  }

  if (!isPublicRoute && status === 'unauthenticated') {
    return null;
  }

  if (isPublicRoute) {
    return <div className="min-h-screen overflow-x-hidden bg-muted/40">{children}</div>;
  }

  return (
    // Fixed shell: the sidebar and topbar stay put; ONLY <main> scrolls. The
    // app is locked to the viewport height (h-screen + overflow-hidden) and the
    // content area gets its own vertical scroll (Renato 2026-09-09).
    <PageTitleProvider>
      <div className="flex h-screen overflow-hidden bg-muted/40">
        <AppSidebar locale={locale} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar locale={locale} />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </PageTitleProvider>
  );
}
