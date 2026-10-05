'use client';

import {
  Activity,
  BarChart3,
  Boxes,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  Sparkles,
  Users
} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';

import type {Locale} from '@/i18n/routing';
import {Link, usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';
import {buildDate, buildLabel} from '@/lib/build-info';
import {useAuth} from '@/hooks/use-auth';
import {isAuditAdmin} from '@/lib/audit-access';
import {useWhatsNew} from './WhatsNew';

const navIcons = {
  dashboard: LayoutDashboard,
  emails: Mail,
  orders: Package,
  customers: Users,
  aiStatus: Activity,
  integrations: Boxes,
  reports: BarChart3,
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

// Renovo-only item (cost/audit reports), appended for allowlisted users.
const reportsItem: {key: NavKey; href: string} = {key: 'reports', href: '/reports'};

function SidebarNav({
  locale,
  onNavigate,
  collapsible
}: {
  locale: Locale;
  onNavigate?: () => void;
  /** Desktop rail: labels are hidden until the sidebar is hovered (group-hover). */
  collapsible?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname() || '';
  const {user} = useAuth();
  const items = isAuditAdmin(user?.email) ? [...navItems, reportsItem] : navItems;

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = navIcons[item.key];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.key}
            href={item.href}
            locale={locale}
            onClick={onNavigate}
            title={collapsible ? t(`navigation.${item.key}`) : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap',
                collapsible &&
                  'max-w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100'
              )}
            >
              {t(`navigation.${item.key}`)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Build/version stamp pinned at the bottom of the sidebar (Renato 2026-10-05).
 * Logout moved to the user menu in the topbar, so this footer now answers
 * "which build is live?" at a glance.
 */
/**
 * Sidebar footer (Renato 2026-10-05): a single control pinned at the very bottom
 * that opens "What's New" and carries the build/version as its caption — so the
 * icon and the version are ONE clickable block (no redundant targets). When
 * there is an unseen release the icon turns amber with a pulsing dot.
 */
function SidebarFooter({
  collapsible,
  onNavigate
}: {
  collapsible?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const date = buildDate(locale);
  const {open, hasUnseen} = useWhatsNew();

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        open();
      }}
      title={t('whatsNew.title')}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        hasUnseen ? 'hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'hover:bg-accent/70'
      )}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <Sparkles
          className={cn('h-4 w-4', hasUnseen ? 'text-amber-500' : 'text-muted-foreground')}
        />
        {hasUnseen ? (
          <span className="absolute -right-1 -top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 overflow-hidden whitespace-nowrap leading-tight',
          collapsible &&
            'max-w-0 opacity-0 transition-all duration-200 group-hover/sidebar:max-w-[180px] group-hover/sidebar:opacity-100'
        )}
      >
        <span
          className={cn(
            'block text-sm',
            hasUnseen
              ? 'font-medium text-amber-600 dark:text-amber-400'
              : 'text-foreground'
          )}
        >
          {t('whatsNew.title')}
        </span>
        <span className="block font-mono text-[11px] text-muted-foreground/60">
          {buildLabel()}
          {date ? ` · ${date}` : ''}
        </span>
      </span>
    </button>
  );
}

export function AppSidebar({locale}: {locale: Locale}) {
  const t = useTranslations();

  // Collapsible rail (Renato 2026-10-05): a 64px icon-only rail that expands to
  // 240px on hover. The expanded panel is absolutely positioned so it overlays
  // the content instead of pushing it (no reflow). `group/sidebar` drives the
  // label/version fade-in inside the nav.
  return (
    <div className="relative hidden h-full w-16 shrink-0 md:block">
      <aside className="group/sidebar absolute inset-y-0 left-0 z-30 flex w-16 flex-col overflow-hidden border-r bg-background transition-[width] duration-200 hover:w-60 hover:shadow-xl">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            P
          </span>
          <span className="truncate whitespace-nowrap text-sm font-semibold tracking-wide text-foreground opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
            {t('app.name')}
          </span>
        </div>
        <div className="px-3 py-4">
          <SidebarNav locale={locale} collapsible />
        </div>
        <div className="mt-auto p-3">
          <SidebarFooter collapsible />
        </div>
      </aside>
    </div>
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
      <div className="mt-auto p-3">
        <SidebarFooter onNavigate={onNavigate} />
      </div>
    </div>
  );
}

