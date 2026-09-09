'use client';

import {
  Activity,
  Boxes,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Settings,
  Users
} from 'lucide-react';
import {useTranslations} from 'next-intl';

import type {Locale} from '@/i18n/routing';
import {Link, usePathname, useRouter} from '@/i18n/navigation';
import {useAuth} from '@/hooks/use-auth';
import {cn} from '@/lib/utils';

const navIcons = {
  dashboard: LayoutDashboard,
  emails: Mail,
  orders: Package,
  customers: Users,
  aiStatus: Activity,
  integrations: Boxes,
  settings: Settings
} as const;

type NavKey = keyof typeof navIcons;

const navItems: Array<{key: NavKey; href: string}> = [
  {key: 'dashboard', href: '/dashboard'},
  {key: 'emails', href: '/emails'},
  {key: 'orders', href: '/orders'},
  {key: 'customers', href: '/customers'},
  {key: 'aiStatus', href: '/ai-status'},
  {key: 'integrations', href: '/integrations'},
  {key: 'settings', href: '/settings'}
];

function SidebarNav({locale, onNavigate}: {locale: Locale; onNavigate?: () => void}) {
  const t = useTranslations();
  const pathname = usePathname() || '';

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = navIcons[item.key];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.key}
            href={item.href}
            locale={locale}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{t(`navigation.${item.key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Logout pinned at the bottom of the sidebar, away from the nav (Renato). */
function SidebarLogout({
  locale,
  onNavigate
}: {
  locale: Locale;
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const {logout, status} = useAuth();

  if (status !== 'authenticated') return null;

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        logout();
        router.replace('/login', {locale});
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
      )}
    >
      <LogOut className="h-4 w-4" />
      <span>{t('topbar.logout')}</span>
    </button>
  );
}

export function AppSidebar({locale}: {locale: Locale}) {
  const t = useTranslations();

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center px-4">
        <div className="text-sm font-semibold tracking-wide text-foreground">
          {t('app.name')}
        </div>
      </div>
      <div className="px-3 py-4">
        <SidebarNav locale={locale} />
      </div>
      <div className="mt-auto border-t p-3">
        <SidebarLogout locale={locale} />
      </div>
    </aside>
  );
}

export function AppSidebarContent({
  locale,
  onNavigate
}: {
  locale: Locale;
  onNavigate?: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <div className="text-sm font-semibold tracking-wide text-foreground">
          {t('app.name')}
        </div>
      </div>
      <div className="px-3 py-4">
        <SidebarNav locale={locale} onNavigate={onNavigate} />
      </div>
      <div className="mt-auto border-t p-3">
        <SidebarLogout locale={locale} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

