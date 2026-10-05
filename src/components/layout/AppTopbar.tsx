'use client';

import {Check, LogOut, Menu, Moon, RefreshCw, Sun} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

import {routing, type Locale} from '@/i18n/routing';
import {useRouter} from '@/i18n/navigation';
import {useAuth} from '@/hooks/use-auth';
import {FlagIcon} from '@/components/layout/flag-icon';
import {AppSidebarContent} from '@/components/layout/AppSidebar';
import {usePageTitle} from '@/components/layout/page-title';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {Sheet, SheetContent, SheetTrigger} from '@/components/ui/sheet';
import {useSyncMailbox} from '@/hooks/use-sync-mailbox';
import {useMailboxes} from '@/hooks/use-mailboxes';
import {cn} from '@/lib/utils';

// A distinct, stable color per user (Renato 2026-10-05). The avatar derives its
// background from a hash of the user's e-mail, so each account gets a consistent
// color. Each entry pairs a base bg with its own hover so it never flips to the
// theme accent on hover.
const AVATAR_COLORS = [
  'bg-rose-500 hover:bg-rose-500/90',
  'bg-orange-500 hover:bg-orange-500/90',
  'bg-amber-500 hover:bg-amber-500/90',
  'bg-lime-600 hover:bg-lime-600/90',
  'bg-emerald-500 hover:bg-emerald-500/90',
  'bg-teal-500 hover:bg-teal-500/90',
  'bg-cyan-600 hover:bg-cyan-600/90',
  'bg-sky-500 hover:bg-sky-500/90',
  'bg-blue-500 hover:bg-blue-500/90',
  'bg-indigo-500 hover:bg-indigo-500/90',
  'bg-violet-500 hover:bg-violet-500/90',
  'bg-fuchsia-500 hover:bg-fuchsia-500/90',
  'bg-pink-500 hover:bg-pink-500/90'
];

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function AppTopbar({locale}: {locale: Locale}) {
  const pageTitle = usePageTitle()?.title;

  return (
    <header className="sticky top-0 z-20 flex min-w-0 flex-wrap items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger
            className="inline-flex items-center justify-center"
            render={<Button variant="outline" size="icon-sm" />}
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <AppSidebarContent locale={locale} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="min-w-0 flex-1">
        {pageTitle ? (
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {pageTitle}
          </h1>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <SyncMailboxButton />
        <Separator orientation="vertical" className="h-6" />
        <UserMenu locale={locale} />
      </div>
    </header>
  );
}

/**
 * Renato 2026-10-05: logged-in user avatar + menu. Besides name/e-mail/role and
 * logout it now also hosts the theme toggle and the language switcher (moved out
 * of the topbar to declutter it). Data comes straight from useAuth.
 */
function UserMenu({locale}: {locale: Locale}) {
  const t = useTranslations();
  const router = useRouter();
  const rawPathname = usePathname() || '/';
  const activeLocale = useLocale() as Locale;
  const {user, status, logout} = useAuth();

  // Theme state (mirrors ThemeToggle): synced to the real class on mount so SSR
  // and first client render match.
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  if (status !== 'authenticated' || !user) return null;

  const label = (user.name || user.email || '').trim();
  const initials =
    label
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?';
  const color = avatarColor(user.email || user.name || label);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === activeLocale) return;
    const segments = rawPathname.split('/').filter(Boolean);
    const locales = routing.locales as readonly string[];
    if (segments.length > 0 && locales.includes(segments[0])) {
      segments.shift();
    }
    const basePath = `/${segments.join('/')}` || '/';
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(qs ? `${basePath}${qs}` : basePath, {locale: nextLocale});
  }

  const themeIsDark = mounted && dark;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              color
            )}
            aria-label={label}
            title={label}
          />
        }
      >
        <span>{initials}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {user.name || user.email}
          </span>
          {user.name ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
          {user.role ? (
            <span className="mt-1">
              <Badge variant="outline" className="text-[10px] uppercase">
                {user.role}
              </Badge>
            </span>
          ) : null}
        </div>

        <DropdownMenuSeparator />

        {/* Theme: stays open so the user sees the change (closeOnClick={false}). */}
        <DropdownMenuItem closeOnClick={false} onClick={toggleTheme}>
          {themeIsDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {themeIsDark ? t('topbar.lightMode') : t('topbar.darkMode')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t('topbar.language')}
        </div>
        {routing.locales.map((nextLocale) => (
          <DropdownMenuItem
            key={nextLocale}
            className="gap-2"
            onClick={() => changeLocale(nextLocale)}
          >
            <FlagIcon code={nextLocale} className="h-4" />
            {t(`languages.${nextLocale}`)}
            {nextLocale === activeLocale ? (
              <Check className="ml-auto h-4 w-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            logout();
            router.replace('/login', {locale});
          }}
        >
          <LogOut className="h-4 w-4" />
          {t('topbar.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SyncMailboxButton() {
  const t = useTranslations();
  const syncMailbox = useSyncMailbox();
  const mailboxesQuery = useMailboxes();
  const [mailboxId, setMailboxId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const activeMailboxes = useMemo(
    () => (mailboxesQuery.data || []).filter((m) => m.active),
    [mailboxesQuery.data],
  );
  const selectedMailbox = useMemo(
    () => activeMailboxes.find((mailbox) => mailbox.id === mailboxId) ?? null,
    [activeMailboxes, mailboxId],
  );

  const canSync = mailboxId.trim().length > 0 && !syncMailbox.isPending;

  function getMailboxLabel(mailbox: {
    email: string;
    department: string;
  }) {
    return `${mailbox.email} - ${mailbox.department}`;
  }

  async function onSubmit() {
    if (!canSync) return;
    const id = mailboxId.trim();
    const toastId = toast.loading(t('topbar.syncMailbox'));
    try {
      await syncMailbox.mutateAsync(id);
      toast.success(t('topbar.toast.syncSuccess'), {id: toastId});
      setOpen(false);
      setMailboxId('');
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? t('topbar.toast.syncError'), {id: toastId});
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setMailboxId('');
          return;
        }

        if (
          !mailboxesQuery.isLoading &&
          !mailboxesQuery.error &&
          activeMailboxes.length === 1
        ) {
          setMailboxId(activeMailboxes[0].id);
        }
      }}
    >
      <DialogTrigger
        render={<Button variant="secondary" size="sm" className="gap-2" />}
      >
        <RefreshCw className="h-4 w-4" />
        {t('topbar.syncMailbox')}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('topbar.syncMailbox')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {mailboxesQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : mailboxesQuery.error ? (
            <div className="text-sm text-destructive">
              {String(mailboxesQuery.error.message)}
            </div>
          ) : (
            <Select
              value={mailboxId}
              onValueChange={(value) => setMailboxId(value ?? '')}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue
                  className="min-w-0 truncate"
                  placeholder={t('topbar.mailboxSelectPlaceholder')}
                >
                  {selectedMailbox ? getMailboxLabel(selectedMailbox) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeMailboxes.length ? (
                  activeMailboxes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getMailboxLabel(m)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    {t('topbar.noActiveMailboxes')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          {syncMailbox.error ? (
            <div className="text-xs text-destructive">
              {String(syncMailbox.error.message)}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={!canSync}>
            {syncMailbox.isPending ? t('common.loading') : t('common.sync')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
