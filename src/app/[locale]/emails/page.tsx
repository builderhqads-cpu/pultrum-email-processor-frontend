"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Inbox, MailOpen, Paperclip } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import type { Locale } from "@/i18n/routing";
import { useEmails } from "@/hooks/use-emails";
import { useDeleteEmail } from "@/hooks/use-delete-email";
import { useMounted } from "@/hooks/use-mounted";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmailPreviewPane } from "@/components/emails/EmailPreviewPane";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import type { EmailMessageListItem } from "@/types";

const emailQueueTabs = ["all", "unprocessed", "processed", "attachments"] as const;
type EmailQueueTab = (typeof emailQueueTabs)[number];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function formatListTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return new Intl.DateTimeFormat(
    locale,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric" },
  ).format(date);
}

function isUnprocessed(status?: string | null) {
  return status === "RECEIVED" || status === "PROCESSING";
}

function getEmailOperationalPriority(status?: string | null) {
  if (status === "FAILED") return 1;
  if (status === "RECEIVED") return 2;
  if (status === "PROCESSING") return 3;
  if (status === "PROCESSED") return 4;
  return 5;
}

function statusDotClass(status?: string | null) {
  if (status === "FAILED") return "bg-red-500";
  if (status === "RECEIVED") return "bg-amber-500";
  if (status === "PROCESSING") return "bg-sky-500";
  if (status === "PROCESSED") return "bg-emerald-500";
  return "bg-muted-foreground/40";
}

function filterEmailsByQueue(
  items: EmailMessageListItem[],
  queueTab: EmailQueueTab,
) {
  switch (queueTab) {
    case "unprocessed":
      return items.filter((item) => isUnprocessed(item.status));
    case "processed":
      return items.filter((item) => item.status === "PROCESSED");
    case "attachments":
      return items.filter((item) => Boolean(item.hasAttachments));
    default:
      return items;
  }
}

export default function EmailsPage() {
  const t = useTranslations("emails");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale() as Locale;
  const mounted = useMounted();
  const labels = emailPageLabels[uiLocale] ?? emailPageLabels.en;

  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("selected");

  const emails = useEmails();
  const deleteEmail = useDeleteEmail();

  const [q, setQ] = useState("");
  const [queueTab, setQueueTab] = useState<EmailQueueTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(selectedParam);
  const [deleteTarget, setDeleteTarget] = useState<EmailMessageListItem | null>(
    null,
  );

  const baseFiltered = useMemo(() => {
    const list = (emails.data ?? []) as EmailMessageListItem[];
    const query = normalize(q);

    return list
      .filter((item) => {
        if (!query) return true;
        const hay = [
          item.subject ?? "",
          item.fromEmail ?? "",
          item.mailbox?.email ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => {
        const priorityDiff =
          getEmailOperationalPriority(a.status) -
          getEmailOperationalPriority(b.status);
        if (priorityDiff !== 0) return priorityDiff;
        return (
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      });
  }, [emails.data, q]);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<EmailQueueTab, number>;
    emailQueueTabs.forEach((key) => {
      counts[key] = filterEmailsByQueue(baseFiltered, key).length;
    });
    return counts;
  }, [baseFiltered]);

  const filtered = useMemo(
    () => filterEmailsByQueue(baseFiltered, queueTab),
    [baseFiltered, queueTab],
  );

  // Conversation view: group by conversationId (fallback threadKey/id). Groups
  // are ordered by most recent activity; messages within a group are oldest-first
  // (original on top, replies below).
  const groups = useMemo(() => {
    const map = new Map<string, EmailMessageListItem[]>();
    for (const item of filtered) {
      const key = item.conversationId || item.threadKey || item.id;
      const arr = map.get(key);
      if (arr) arr.push(item);
      else map.set(key, [item]);
    }
    return Array.from(map.entries())
      .map(([key, items]) => {
        const sorted = [...items].sort(
          (a, b) =>
            new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
        );
        const latestTs = new Date(
          sorted[sorted.length - 1].receivedAt,
        ).getTime();
        return { key, items: sorted, latestTs };
      })
      .sort((a, b) => b.latestTs - a.latestTs);
  }, [filtered]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const renderEmailRow = (
    item: EmailMessageListItem,
    opts: { nested?: boolean },
  ) => (
    <button
      key={item.id}
      type="button"
      onClick={() => setSelectedId(item.id)}
      className={cn(
        "block w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
        opts.nested ? "border-t bg-muted/10 pl-8" : "border-b",
        selectedId === item.id && "bg-muted",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            statusDotClass(item.status),
          )}
        />
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
          title={item.fromEmail || tCommon("na")}
        >
          {item.fromEmail || tCommon("na")}
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {item.receivedAt ? formatListTime(item.receivedAt, uiLocale) : ""}
        </span>
      </div>
      <div
        className="mt-1 truncate pl-4 text-sm text-muted-foreground"
        title={item.subject || tCommon("na")}
      >
        {item.subject || tCommon("na")}
      </div>
      <div className="mt-1.5 flex items-center gap-2 pl-4">
        <StatusBadge status={item.status ?? tCommon("na")} />
        {item.isTransportOrder === false ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            {labels.notTransport}
          </span>
        ) : null}
        {item.hasAttachments ? (
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
        ) : null}
      </div>
    </button>
  );

  // Keep a valid selection: default to the first email, and recover when the
  // current selection drops out of the filtered list.
  useEffect(() => {
    if (!filtered.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((item) => item.id === selectedId)) {
      const preferred =
        selectedParam && filtered.some((item) => item.id === selectedParam)
          ? selectedParam
          : filtered[0].id;
      setSelectedId(preferred);
    }
  }, [filtered, selectedId, selectedParam]);

  const isLoading = emails.loading;
  const hasError = Boolean(emails.error);

  async function refetchAll() {
    await emails.refetch();
  }

  async function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);

    const toastId = toast.loading(labels.deleteLoading);
    try {
      const result = await deleteEmail.mutateAsync(target.id);
      toast.success(
        result.deletedOrderId
          ? labels.deleteSuccessWithOrder
          : labels.deleteSuccess,
        { id: toastId },
      );
      if (selectedId === target.id) setSelectedId(null);
      await refetchAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? labels.deleteError, { id: toastId });
    }
  }

  const selectedListItem = selectedId
    ? filtered.find((item) => item.id === selectedId) ?? null
    : null;

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-4 lg:h-[calc(100vh-7rem)]">
      <PageHeader
        title={labels.inboxTitle}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={!mounted || isLoading}
          >
            {tCommon("refetch")}
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left: inbox list */}
        <Card className="flex h-[60vh] min-h-0 flex-col overflow-hidden lg:h-auto">
          <div className="space-y-3 border-b p-3">
            <div className="flex flex-wrap gap-1.5">
              {emailQueueTabs.map((key) => {
                const active = queueTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setQueueTab(key)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {labels.quickTabs[key]} ({tabCounts[key]})
                  </button>
                );
              })}
            </div>
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t("filters.searchPlaceholder")}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {isLoading ? (
              <div className="space-y-px p-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`email-sk:${index}`} className="space-y-2 p-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : hasError ? (
              <div className="p-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {String(emails.error?.message)}
                </div>
                <Button className="mt-3" onClick={refetchAll}>
                  {tCommon("tryAgain")}
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={labels.emptyTitle}
                description={t("empty")}
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              groups.map((group) => {
                if (group.items.length === 1) {
                  return renderEmailRow(group.items[0], {});
                }
                const latest = group.items[group.items.length - 1];
                const expanded = expandedGroups.has(group.key);
                return (
                  <div key={group.key} className="border-b">
                    <button
                      type="button"
                      onClick={() => {
                        toggleGroup(group.key);
                        setSelectedId(latest.id);
                      }}
                      className={cn(
                        "block w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                        !expanded && selectedId === latest.id && "bg-muted",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                            expanded && "rotate-90",
                          )}
                        />
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            statusDotClass(latest.status),
                          )}
                        />
                        <span
                          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
                          title={latest.fromEmail || tCommon("na")}
                        >
                          {latest.fromEmail || tCommon("na")}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {latest.receivedAt
                            ? formatListTime(latest.receivedAt, uiLocale)
                            : ""}
                        </span>
                      </div>
                      <div
                        className="mt-1 truncate pl-5 text-sm text-muted-foreground"
                        title={latest.subject || tCommon("na")}
                      >
                        {latest.subject || tCommon("na")}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 pl-5">
                        <StatusBadge status={latest.status ?? tCommon("na")} />
                        <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
                          {labels.replies(group.items.length - 1)}
                        </span>
                      </div>
                    </button>
                    {expanded
                      ? group.items.map((it) =>
                          renderEmailRow(it, { nested: true }),
                        )
                      : null}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right: preview */}
        <Card className="flex h-[70vh] min-h-0 flex-col overflow-hidden lg:h-auto">
          {selectedId ? (
            <EmailPreviewPane
              key={selectedId}
              emailId={selectedId}
              deleteLabel={labels.deleteAction}
              deleting={deleteEmail.isPending}
              onDeleteRequest={() =>
                setDeleteTarget(
                  selectedListItem ??
                    ({ id: selectedId } as EmailMessageListItem),
                )
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState
                icon={MailOpen}
                title={labels.selectEmailTitle}
                description={labels.selectEmailDescription}
                className="border-0 bg-transparent shadow-none"
              />
            </div>
          )}
        </Card>
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {labels.deleteAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const emailPageLabels: Record<
  Locale,
  {
    inboxTitle: string;
    quickTabs: Record<EmailQueueTab, string>;
    emptyTitle: string;
    selectEmailTitle: string;
    selectEmailDescription: string;
    deleteAction: string;
    deleteLoading: string;
    deleteSuccess: string;
    deleteSuccessWithOrder: string;
    deleteError: string;
    deleteConfirmTitle: string;
    deleteConfirm: string;
    notTransport: string;
    replies: (count: number) => string;
  }
> = {
  pt: {
    inboxTitle: "Caixa de triagem",
    quickTabs: {
      all: "Todos",
      unprocessed: "Nao processados",
      processed: "Processados",
      attachments: "Com anexos",
    },
    emptyTitle: "Inbox vazia",
    selectEmailTitle: "Selecione um e-mail",
    selectEmailDescription:
      "Escolha um e-mail na lista a esquerda para ver o preview e as acoes.",
    deleteAction: "Excluir",
    deleteLoading: "Excluindo e-mail...",
    deleteSuccess: "E-mail excluido",
    deleteSuccessWithOrder: "E-mail e pedido vinculado excluidos",
    deleteError: "Falha ao excluir e-mail",
    deleteConfirmTitle: "Excluir este e-mail?",
    deleteConfirm:
      "Essa acao remove o e-mail do sistema. Se houver um pedido vinculado, ele e os replies tambem serao removidos.",
    notTransport: "Nao e transporte",
    replies: (n) => (n === 1 ? "1 resposta" : `${n} respostas`),
  },
  en: {
    inboxTitle: "Triage Inbox",
    quickTabs: {
      all: "All",
      unprocessed: "Unprocessed",
      processed: "Processed",
      attachments: "With attachments",
    },
    emptyTitle: "Inbox is empty",
    selectEmailTitle: "Select an email",
    selectEmailDescription:
      "Pick an email from the list on the left to preview it and take action.",
    deleteAction: "Delete",
    deleteLoading: "Deleting email...",
    deleteSuccess: "Email deleted",
    deleteSuccessWithOrder: "Email and linked order deleted",
    deleteError: "Failed to delete email",
    deleteConfirmTitle: "Delete this email?",
    deleteConfirm:
      "This removes the email from the system. If an order is linked, it and its replies are removed too.",
    notTransport: "Not transport",
    replies: (n) => (n === 1 ? "1 reply" : `${n} replies`),
  },
  nl: {
    inboxTitle: "Triage-inbox",
    quickTabs: {
      all: "Alle",
      unprocessed: "Niet verwerkt",
      processed: "Verwerkt",
      attachments: "Met bijlagen",
    },
    emptyTitle: "Inbox is leeg",
    selectEmailTitle: "Selecteer een e-mail",
    selectEmailDescription:
      "Kies een e-mail uit de lijst links om het voorbeeld te zien en actie te ondernemen.",
    deleteAction: "Verwijderen",
    deleteLoading: "E-mail verwijderen...",
    deleteSuccess: "E-mail verwijderd",
    deleteSuccessWithOrder: "E-mail en gekoppelde opdracht verwijderd",
    deleteError: "E-mail verwijderen mislukt",
    deleteConfirmTitle: "Deze e-mail verwijderen?",
    deleteConfirm:
      "Hiermee wordt de e-mail uit het systeem verwijderd. Een gekoppelde opdracht en antwoorden worden ook verwijderd.",
    notTransport: "Geen transport",
    replies: (n) => (n === 1 ? "1 antwoord" : `${n} antwoorden`),
  },
};
