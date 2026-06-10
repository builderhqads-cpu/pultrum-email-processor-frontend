'use client';

import {AppSidebar} from './AppSidebar';
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

  const isLoginRoute = useMemo(() => pathname === '/login', [pathname]);

  useEffect(() => {
    if (isLoginRoute) return;
    if (status === 'unauthenticated') {
      router.replace('/login', {locale});
    }
  }, [isLoginRoute, status, router, locale]);

  if (!isLoginRoute && status === 'loading') {
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

  if (!isLoginRoute && status === 'unauthenticated') {
    return null;
  }

  if (isLoginRoute) {
    return <div className="min-h-screen overflow-x-hidden bg-muted/40">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/40">
      <div className="flex min-h-screen min-w-0">
        <AppSidebar locale={locale} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar locale={locale} />
          <main className="min-w-0 overflow-x-hidden flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
