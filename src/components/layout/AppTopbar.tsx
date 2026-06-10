'use client';

import {LogOut, Menu, RefreshCw} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useMemo, useState} from 'react';
import {toast} from 'sonner';

import type {Locale} from '@/i18n/routing';
import {useRouter} from '@/i18n/navigation';
import {LanguageSwitcher} from '@/components/layout/LanguageSwitcher';
import {AppSidebarContent} from '@/components/layout/AppSidebar';
import {Button} from '@/components/ui/button';
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
import {useAuth} from '@/hooks/use-auth';

export function AppTopbar({locale}: {locale: Locale}) {
  const t = useTranslations();
  const router = useRouter();
  const {logout, status} = useAuth();

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
        <div className="truncate text-sm font-semibold text-foreground">
          {t('topbar.systemTitle')}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <SyncMailboxButton />
        <Separator orientation="vertical" className="h-6" />
        <LanguageSwitcher />
        {status === 'authenticated' ? (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                logout();
                router.replace('/login', {locale});
              }}
            >
              <LogOut className="h-4 w-4" />
              {t('topbar.logout')}
            </Button>
          </>
        ) : null}
      </div>
    </header>
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
