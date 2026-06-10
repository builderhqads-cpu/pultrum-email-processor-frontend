"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Boxes,
  CheckCircle2,
  HardDrive,
  Info,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useHealth } from "@/hooks/use-health";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCreateMailbox,
  useDeleteMailbox,
  useUpdateMailbox,
} from "@/hooks/use-manage-mailboxes";
import { useMailboxes } from "@/hooks/use-mailboxes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getMessageString, type Messages } from "@/i18n/message-utils";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { Department, Mailbox as MailboxRecord } from "@/types";
import { AutomationSettings } from "./AutomationSettings";

function Flag({ ok }: { ok: boolean }) {
  return <StatusBadge status={ok ? "CONFIGURED" : "NOT_CONFIGURED"} />;
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-background/70 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "min-w-0 text-sm text-foreground",
          mono && "break-all font-mono text-xs [overflow-wrap:anywhere]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

const departmentOptions: Department[] = ["OPEN_TRANSPORT", "STUK_GOED"];

type SettingsTab = "general" | "mailboxes" | "ai" | "automation" | "system";

function MailboxStatusPill({
  mailbox,
  connectedLabel,
  disconnectedLabel,
}: {
  mailbox: MailboxRecord;
  connectedLabel: string;
  disconnectedLabel: string;
}) {
  // Status reflects Microsoft Graph authentication: green when authenticated,
  // red when the account is not connected to Microsoft Graph.
  const connected = Boolean(mailbox.graphConnected);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-emerald-500" : "bg-red-500",
        )}
      />
      {connected ? connectedLabel : disconnectedLabel}
    </span>
  );
}

function AiStatusPill({
  active,
  activeLabel,
  pausedLabel,
}: {
  active: boolean;
  activeLabel: string;
  pausedLabel: string;
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {pausedLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300">
      <Bot className="h-3.5 w-3.5" />
      {activeLabel}
    </span>
  );
}

function GraphStatusPill({
  connected,
  connectUrl,
  connectedLabel,
  reconnectLabel,
}: {
  connected: boolean;
  connectUrl: string;
  connectedLabel: string;
  reconnectLabel: string;
}) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {connectedLabel}
      </span>
    );
  }
  return (
    <a
      href={connectUrl}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      {reconnectLabel}
    </a>
  );
}

export function SettingsScreen() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const messages = useMessages() as Messages;
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const labels = settingsLabels[locale] ?? settingsLabels.en;
  const health = useHealth();
  const mailboxes = useMailboxes();
  const createMailbox = useCreateMailbox();
  const deleteMailbox = useDeleteMailbox();
  const updateMailbox = useUpdateMailbox();
  const [newMailboxEmail, setNewMailboxEmail] = useState("");
  const [newMailboxDepartment, setNewMailboxDepartment] =
    useState<Department>("OPEN_TRANSPORT");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [newMailboxOpen, setNewMailboxOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MailboxRecord | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<MailboxRecord | null>(null);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  const microsoftConnectBaseUrl = apiUrl
    ? `${apiUrl.replace(/\/+$/, "")}/auth/microsoft/mailboxes`
    : "/api/auth/microsoft/mailboxes";
  const cgEndpointConfigured = Boolean(
    health.data?.config?.creativeGears?.endpointConfigured,
  );
  const aiConfigured = Boolean(health.data?.config?.ai?.apiConfigured);

  const mailboxList = mailboxes.data ?? [];
  const activeMailboxes = mailboxList.filter((mailbox) => mailbox.active);
  const latestSync = [...activeMailboxes]
    .map((mailbox) => mailbox.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const microsoftResult = searchParams.get("microsoft");
  const microsoftReason = searchParams.get("reason");
  const microsoftMailboxId = searchParams.get("mailboxId");

  // After the Microsoft OAuth redirect lands back on this page, surface the
  // result on the Mailboxes tab so the operator sees the confirmation.
  useEffect(() => {
    if (microsoftResult === "connected") {
      setActiveTab("mailboxes");
      toast.success(labels.microsoft.connectedMessage);
    } else if (microsoftResult === "error") {
      setActiveTab("mailboxes");
      toast.error(
        microsoftReason
          ? `${labels.microsoft.errorMessage} ${microsoftReason}`
          : labels.microsoft.errorMessage,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microsoftResult, microsoftMailboxId, microsoftReason]);

  function getDepartmentLabel(department: Department) {
    return (
      getMessageString(messages, `enums.department.${department}`) ?? department
    );
  }

  async function handleCreateMailbox() {
    const email = newMailboxEmail.trim();
    if (!email) return;

    const toastId = toast.loading(labels.mailboxes.createLoading);
    try {
      await createMailbox.mutateAsync({
        email,
        department: newMailboxDepartment,
        active: true,
      });
      setNewMailboxEmail("");
      setNewMailboxDepartment("OPEN_TRANSPORT");
      setNewMailboxOpen(false);
      toast.success(labels.mailboxes.createSuccess, { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message ?? labels.mailboxes.createError, { id: toastId });
    }
  }

  async function handleToggleMailbox(mailbox: MailboxRecord) {
    const nextActive = !mailbox.active;
    const toastId = toast.loading(
      nextActive
        ? labels.mailboxes.activateLoading
        : labels.mailboxes.deactivateLoading,
    );

    try {
      await updateMailbox.mutateAsync({
        mailboxId: mailbox.id,
        payload: { active: nextActive },
      });
      toast.success(
        nextActive
          ? labels.mailboxes.activateSuccess
          : labels.mailboxes.deactivateSuccess,
        { id: toastId },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message ?? labels.mailboxes.updateError, { id: toastId });
    }
  }

  async function handleDeleteMailbox(mailbox: MailboxRecord) {
    const toastId = toast.loading(labels.mailboxes.deleteLoading);

    try {
      const result = await deleteMailbox.mutateAsync(mailbox.id);
      toast.success(
        labels.mailboxes.deleteSuccess
          .replace("{email}", result.deletedMailboxEmail)
          .replace("{emails}", String(result.deletedEmailsCount))
          .replace("{orders}", String(result.deletedOrdersCount)),
        { id: toastId },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message ?? labels.mailboxes.deleteError, { id: toastId });
    }
  }

  return (
    <div className="mx-auto min-w-0 w-full">
      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b px-3">
          {(
            [
              ["general", labels.tabs.general],
              ["mailboxes", labels.tabs.mailboxes],
              ["ai", labels.tabs.aiConfig],
              ["automation", labels.tabs.automation],
              ["system", labels.tabs.system],
            ] as Array<[SettingsTab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                activeTab === key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {activeTab === key ? (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          ))}
        </div>

        <CardContent className="space-y-5 pt-5">
          {activeTab === "general" ? (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.general.mailbox}</TableHead>
                    <TableHead>{labels.general.expiresAt}</TableHead>
                    <TableHead>{labels.general.status}</TableHead>
                    <TableHead>{labels.general.aiConfidence}</TableHead>
                    <TableHead className="text-right">
                      {labels.general.actions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mailboxList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {labels.mailboxes.empty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    mailboxList.map((mailbox) => (
                      <TableRow key={mailbox.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {mailbox.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getDepartmentLabel(mailbox.department)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(mailbox.graphTokenExpiresAt, locale) ??
                            "—"}
                        </TableCell>
                        <TableCell>
                          <MailboxStatusPill
                            mailbox={mailbox}
                            connectedLabel={labels.general.statusConnected}
                            disconnectedLabel={labels.general.statusDisconnected}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`${microsoftConnectBaseUrl}/${mailbox.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            {labels.general.connectGraph}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {activeTab === "mailboxes" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">
                    {labels.mailboxes.managementTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {labels.mailboxes.active}: {activeMailboxes.length} ·{" "}
                    {labels.mailboxes.total}: {mailboxList.length}
                    {latestSync
                      ? ` · ${labels.mailboxes.lastSync}: ${formatDateTime(latestSync, locale)}`
                      : ""}
                  </p>
                </div>
                <Button onClick={() => setNewMailboxOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {labels.mailboxes.newMailbox}
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{labels.mailboxes.emailLabel}</TableHead>
                      <TableHead>{labels.mailboxes.department}</TableHead>
                      <TableHead>{labels.mailboxes.aiStatus}</TableHead>
                      <TableHead>{labels.mailboxes.graphStatus}</TableHead>
                      <TableHead>{labels.mailboxes.lastSync}</TableHead>
                      <TableHead className="w-10 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mailboxList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {labels.mailboxes.empty}
                        </TableCell>
                      </TableRow>
                    ) : (
                      mailboxList.map((mailbox) => (
                        <TableRow key={mailbox.id}>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => setDetailsTarget(mailbox)}
                              className="block max-w-[240px] truncate text-left font-medium text-foreground hover:underline"
                              title={mailbox.email}
                            >
                              {mailbox.email}
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getDepartmentLabel(mailbox.department)}
                          </TableCell>
                          <TableCell>
                            <AiStatusPill
                              active={mailbox.active}
                              activeLabel={labels.mailboxes.aiActive}
                              pausedLabel={labels.mailboxes.aiPaused}
                            />
                          </TableCell>
                          <TableCell>
                            <GraphStatusPill
                              connected={Boolean(mailbox.graphConnected)}
                              connectUrl={`${microsoftConnectBaseUrl}/${mailbox.id}`}
                              connectedLabel={labels.mailboxes.graphConnected}
                              reconnectLabel={labels.mailboxes.graphReconnect}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(mailbox.lastSyncedAt, locale) ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon-sm" />}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">
                                  {labels.mailboxes.rowActions}
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-44">
                                <DropdownMenuItem
                                  onClick={() => setDetailsTarget(mailbox)}
                                >
                                  <Info className="h-4 w-4" />
                                  {labels.mailboxes.detailsAction}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  render={
                                    <a
                                      href={`${microsoftConnectBaseUrl}/${mailbox.id}`}
                                    />
                                  }
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  {mailbox.graphConnected
                                    ? labels.microsoft.reconnect
                                    : labels.microsoft.connectMailbox}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleMailbox(mailbox)}
                                  disabled={
                                    updateMailbox.isPending ||
                                    deleteMailbox.isPending
                                  }
                                >
                                  <Power className="h-4 w-4" />
                                  {mailbox.active
                                    ? labels.mailboxes.deactivateAction
                                    : labels.mailboxes.activateAction}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteTarget(mailbox)}
                                  disabled={
                                    updateMailbox.isPending ||
                                    deleteMailbox.isPending
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {labels.mailboxes.deleteAction}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Dialog open={newMailboxOpen} onOpenChange={setNewMailboxOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{labels.mailboxes.createTitle}</DialogTitle>
                    <DialogDescription>
                      {labels.mailboxes.createDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        {labels.mailboxes.emailLabel}
                      </label>
                      <Input
                        value={newMailboxEmail}
                        onChange={(event) =>
                          setNewMailboxEmail(event.target.value)
                        }
                        placeholder={labels.mailboxes.emailPlaceholder}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        {labels.mailboxes.department}
                      </label>
                      <Select
                        value={newMailboxDepartment}
                        onValueChange={(value) =>
                          setNewMailboxDepartment(value as Department)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={labels.mailboxes.department}>
                            {getDepartmentLabel(newMailboxDepartment)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((department) => (
                            <SelectItem key={department} value={department}>
                              {getDepartmentLabel(department)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      {tCommon("cancel")}
                    </DialogClose>
                    <Button
                      onClick={handleCreateMailbox}
                      disabled={
                        !newMailboxEmail.trim() || createMailbox.isPending
                      }
                    >
                      {createMailbox.isPending
                        ? tCommon("loading")
                        : labels.mailboxes.createAction}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                  if (!open) setDeleteTarget(null);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {labels.mailboxes.deleteConfirmTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {deleteTarget
                        ? labels.mailboxes.deleteConfirmDescription
                            .replace("{email}", deleteTarget.email)
                            .replace(
                              "{department}",
                              getDepartmentLabel(deleteTarget.department),
                            )
                        : ""}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        if (deleteTarget) handleDeleteMailbox(deleteTarget);
                        setDeleteTarget(null);
                      }}
                    >
                      {labels.mailboxes.deleteAction}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Sheet
                open={Boolean(detailsTarget)}
                onOpenChange={(open) => {
                  if (!open) setDetailsTarget(null);
                }}
              >
                <SheetContent side="right" className="w-full sm:max-w-md">
                  {detailsTarget ? (
                    <>
                      <SheetHeader>
                        <SheetTitle className="truncate">
                          {detailsTarget.email}
                        </SheetTitle>
                        <SheetDescription>
                          {getDepartmentLabel(detailsTarget.department)} ·{" "}
                          {labels.microsoft.title}
                        </SheetDescription>
                      </SheetHeader>

                      <div className="flex-1 space-y-3 overflow-y-auto px-4">
                        <Row
                          label={labels.microsoft.status}
                          value={
                            <Flag ok={Boolean(detailsTarget.graphConnected)} />
                          }
                        />
                        <Row
                          label={labels.microsoft.account}
                          value={
                            detailsTarget.graphConnectedEmail ?? tCommon("na")
                          }
                          mono
                        />
                        <Row
                          label={labels.microsoft.displayName}
                          value={detailsTarget.graphDisplayName ?? tCommon("na")}
                        />
                        <Row
                          label={labels.microsoft.expiresAt}
                          value={
                            formatDateTime(
                              detailsTarget.graphTokenExpiresAt,
                              locale,
                            ) ?? tCommon("na")
                          }
                        />
                        <Row
                          label={labels.microsoft.refreshToken}
                          value={
                            detailsTarget.graphHasRefreshToken
                              ? labels.microsoft.available
                              : labels.microsoft.unavailable
                          }
                        />

                        {microsoftResult === "connected" &&
                        microsoftMailboxId === detailsTarget.id ? (
                          <div className="rounded-xl border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {labels.microsoft.connectedMessage}
                          </div>
                        ) : null}
                        {microsoftResult === "error" &&
                        microsoftMailboxId === detailsTarget.id ? (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {labels.microsoft.errorMessage}
                            {microsoftReason ? ` ${microsoftReason}` : ""}
                          </div>
                        ) : null}
                      </div>

                      <SheetFooter>
                        <a
                          href={`${microsoftConnectBaseUrl}/${detailsTarget.id}`}
                          className={buttonVariants({ className: "w-full" })}
                        >
                          {detailsTarget.graphConnected
                            ? labels.microsoft.reconnect
                            : labels.microsoft.connectMailbox}
                        </a>
                      </SheetFooter>
                    </>
                  ) : null}
                </SheetContent>
              </Sheet>
            </div>
          ) : null}

          {activeTab === "ai" ? (
            <SettingsMetricCard
              icon={Bot}
          title={labels.ai.title}
          description={labels.ai.description}
          tone={aiConfigured ? "success" : "warning"}
          badge={<Flag ok={aiConfigured} />}
        >
          <div className="grid grid-cols-1 gap-3">
            <Row
              label={t("ai.configStatus")}
              value={<Flag ok={aiConfigured} />}
            />
            <Row label={labels.ai.source} value={labels.ai.backendManaged} />
          </div>
            </SettingsMetricCard>
          ) : null}

          {activeTab === "automation" ? <AutomationSettings /> : null}

          {activeTab === "system" ? (
            <SettingsMetricCard
          icon={Boxes}
          title={labels.creativeGears.title}
          description={labels.creativeGears.description}
          tone={cgEndpointConfigured ? "success" : "warning"}
          badge={<Flag ok={cgEndpointConfigured} />}
        >
          <div className="grid grid-cols-1 gap-3">
            <Row
              label={t("creativeGears.configStatus")}
              value={<Flag ok={cgEndpointConfigured} />}
            />
            <Row
              label={t("creativeGears.endpointConfigured")}
              value={<Flag ok={cgEndpointConfigured} />}
            />
          </div>
        </SettingsMetricCard>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDateTime(value: string | null | undefined, locale: Locale) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SettingsMetricCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  tone,
  action,
}: {
  icon: typeof HardDrive;
  title: string;
  description: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  action?: React.ReactNode;
}) {
  // All settings cards use the default (white) card surface — no tinted tones.
  const toneClassName = {
    info: "",
    success: "",
    warning: "",
    danger: "",
    neutral: "",
  }[tone];

  return (
    <Card className={cn("min-w-0 overflow-hidden", toneClassName)}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl border bg-background p-2.5 text-muted-foreground shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">{title}</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            </div>
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

const settingsLabels: Record<
  Locale,
  {
    mailboxes: {
      title: string;
      description: string;
      active: string;
      total: string;
      lastSync: string;
      status: string;
      graph: string;
      openInbox: string;
      createTitle: string;
      createDescription: string;
      createAction: string;
      createLoading: string;
      createSuccess: string;
      createError: string;
      renameAction: string;
      renameTitle: string;
      renameSave: string;
      renameLoading: string;
      renameSuccess: string;
      renameError: string;
      deleteAction: string;
      deleteLoading: string;
      deleteSuccess: string;
      deleteError: string;
      deleteConfirmTitle: string;
      deleteConfirmDescription: string;
      activateAction: string;
      deactivateAction: string;
      activateLoading: string;
      deactivateLoading: string;
      activateSuccess: string;
      deactivateSuccess: string;
      updateError: string;
      activeStatus: string;
      inactiveStatus: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      department: string;
      empty: string;
      managementTitle: string;
      newMailbox: string;
      emailLabel: string;
      aiStatus: string;
      aiActive: string;
      aiPaused: string;
      graphStatus: string;
      graphConnected: string;
      graphReconnect: string;
      rowActions: string;
      detailsAction: string;
    };
    ai: {
      title: string;
      description: string;
      source: string;
      backendManaged: string;
    };
    microsoft: {
      title: string;
      description: string;
      status: string;
      account: string;
      displayName: string;
      expiresAt: string;
      refreshToken: string;
      connectMailbox: string;
      reconnect: string;
      connectedMessage: string;
      errorMessage: string;
      available: string;
      unavailable: string;
      empty: string;
    };
    smtp: {
      title: string;
      description: string;
      usage: string;
      visibility: string;
      replyFlow: string;
      notExposed: string;
      backendManaged: string;
    };
    creativeGears: {
      title: string;
      description: string;
    };
    system: {
      title: string;
      description: string;
      mailProvider: string;
    };
    tabs: {
      general: string;
      mailboxes: string;
      aiConfig: string;
      microsoftGraph: string;
      automation: string;
      system: string;
    };
    general: {
      mailbox: string;
      expiresAt: string;
      status: string;
      aiConfidence: string;
      actions: string;
      connectGraph: string;
      statusConnected: string;
      statusDisconnected: string;
      systemStatus: string;
    };
  }
> = {
  pt: {
    mailboxes: {
      title: "Mailboxes",
      description: "Visao operacional das caixas monitoradas pelo frontend.",
      active: "Ativas",
      total: "Total",
      lastSync: "Ultima sincronizacao",
      status: "Status",
      graph: "Microsoft Graph",
      openInbox: "Abrir inbox",
      createTitle: "Nova mailbox",
      createDescription:
        "Cadastre a caixa no sistema e depois conecte a conta na secao Microsoft Graph.",
      createAction: "Criar mailbox",
      createLoading: "Criando mailbox...",
      createSuccess: "Mailbox criada",
      createError: "Falha ao criar mailbox",
      renameAction: "Renomear",
      renameTitle: "Renomear mailbox",
      renameSave: "Salvar nome",
      renameLoading: "Salvando nome...",
      renameSuccess: "Nome da mailbox atualizado",
      renameError: "Falha ao atualizar nome da mailbox",
      deleteAction: "Excluir",
      deleteLoading: "Excluindo mailbox...",
      deleteSuccess:
        "Mailbox {email} excluida. {emails} email(s) e {orders} pedido(s) removidos.",
      deleteError: "Falha ao excluir mailbox",
      deleteConfirmTitle: "Excluir esta mailbox?",
      deleteConfirmDescription:
        "A mailbox {email} do departamento {department} sera removida permanentemente. Todos os emails, anexos e pedidos sincronizados por essa caixa tambem serao excluidos.",
      activateAction: "Ativar",
      deactivateAction: "Desativar",
      activateLoading: "Ativando mailbox...",
      deactivateLoading: "Desativando mailbox...",
      activateSuccess: "Mailbox ativada",
      deactivateSuccess: "Mailbox desativada",
      updateError: "Falha ao atualizar mailbox",
      activeStatus: "Ativa",
      inactiveStatus: "Inativa",
      namePlaceholder: "Nome da mailbox",
      emailPlaceholder: "email@empresa.com",
      department: "Departamento",
      empty: "Nenhuma mailbox cadastrada ainda.",
      managementTitle: "Gestao de mailboxes",
      newMailbox: "Nova mailbox",
      emailLabel: "E-mail",
      aiStatus: "Status da IA",
      aiActive: "IA ativa",
      aiPaused: "Pausada",
      graphStatus: "Status do MS Graph",
      graphConnected: "MS Graph conectado",
      graphReconnect: "Reconectar MS Graph",
      rowActions: "Acoes da mailbox",
      detailsAction: "Detalhes",
    },
    ai: {
      title: "IA",
      description: "Estado geral da configuracao de inteligencia artificial.",
      source: "Origem",
      backendManaged: "Gerenciado pelo backend",
    },
    microsoft: {
      title: "Microsoft Graph",
      description:
        "Conta Microsoft conectada para leitura de emails via Graph.",
      status: "Status",
      account: "Conta",
      displayName: "Nome exibido",
      expiresAt: "Expira em",
      refreshToken: "Refresh token",
      connectMailbox: "Conectar mailbox",
      reconnect: "Reconectar Microsoft",
      connectedMessage: "Conta Microsoft conectada com sucesso.",
      errorMessage: "Falha ao conectar conta Microsoft.",
      available: "Disponivel",
      unavailable: "Indisponivel",
      empty: "Crie e ative uma mailbox para conectar no Microsoft Graph.",
    },
    smtp: {
      title: "SMTP",
      description: "Canal usado para enviar respostas ao cliente.",
      usage: "Uso",
      visibility: "Visibilidade",
      replyFlow: "Respostas ao cliente",
      notExposed: "Nao exposto pelo health atual",
      backendManaged: "Backend",
    },
    creativeGears: {
      title: "Creative Gears",
      description: "Disponibilidade da integracao de entrega XML.",
    },
    system: {
      title: "Sistema",
      description:
        "Conexao principal do frontend com a API e configuracoes base.",
      mailProvider: "Provedor de entrada",
    },
    tabs: {
      general: "Geral",
      mailboxes: "Mailboxes",
      aiConfig: "Config. de IA",
      microsoftGraph: "Microsoft Graph",
      automation: "Automacao",
      system: "Sistema e integracoes",
    },
    general: {
      mailbox: "Mailbox",
      expiresAt: "Expira em",
      status: "Status",
      aiConfidence: "Detalhes de confianca da IA",
      actions: "Acoes",
      connectGraph: "Conectar Microsoft Graph",
      statusConnected: "Conectado",
      statusDisconnected: "Nao conectado",
      systemStatus: "Sistema e integracoes",
    },
  },
  en: {
    mailboxes: {
      title: "Mailboxes",
      description: "Operational view of the inboxes monitored by the frontend.",
      active: "Active",
      total: "Total",
      lastSync: "Last sync",
      status: "Status",
      graph: "Microsoft Graph",
      openInbox: "Open inbox",
      createTitle: "New mailbox",
      createDescription:
        "Register the mailbox in the system first, then connect the account in the Microsoft Graph section.",
      createAction: "Create mailbox",
      createLoading: "Creating mailbox...",
      createSuccess: "Mailbox created",
      createError: "Failed to create mailbox",
      renameAction: "Rename",
      renameTitle: "Rename mailbox",
      renameSave: "Save name",
      renameLoading: "Saving name...",
      renameSuccess: "Mailbox name updated",
      renameError: "Failed to update mailbox name",
      deleteAction: "Delete",
      deleteLoading: "Deleting mailbox...",
      deleteSuccess:
        "Mailbox {email} deleted. {emails} email(s) and {orders} order(s) removed.",
      deleteError: "Failed to delete mailbox",
      deleteConfirmTitle: "Delete this mailbox?",
      deleteConfirmDescription:
        "The mailbox {email} in department {department} will be permanently removed. All emails, attachments, and orders synced by this mailbox will also be deleted.",
      activateAction: "Activate",
      deactivateAction: "Deactivate",
      activateLoading: "Activating mailbox...",
      deactivateLoading: "Deactivating mailbox...",
      activateSuccess: "Mailbox activated",
      deactivateSuccess: "Mailbox deactivated",
      updateError: "Failed to update mailbox",
      activeStatus: "Active",
      inactiveStatus: "Inactive",
      namePlaceholder: "Mailbox name",
      emailPlaceholder: "email@company.com",
      department: "Department",
      empty: "No mailboxes registered yet.",
      managementTitle: "Mailboxes Management",
      newMailbox: "New Mailbox",
      emailLabel: "E-mail",
      aiStatus: "AI Status",
      aiActive: "AI Active",
      aiPaused: "Paused",
      graphStatus: "MS Graph Status",
      graphConnected: "MS Graph Connected",
      graphReconnect: "MS Graph Reconnect",
      rowActions: "Mailbox actions",
      detailsAction: "Details",
    },
    ai: {
      title: "AI",
      description:
        "Overall state of the artificial intelligence configuration.",
      source: "Source",
      backendManaged: "Managed by the backend",
    },
    microsoft: {
      title: "Microsoft Graph",
      description: "Connected Microsoft account used to read emails via Graph.",
      status: "Status",
      account: "Account",
      displayName: "Display name",
      expiresAt: "Expires at",
      refreshToken: "Refresh token",
      connectMailbox: "Connect mailbox",
      reconnect: "Reconnect Microsoft",
      connectedMessage: "Microsoft account connected successfully.",
      errorMessage: "Failed to connect Microsoft account.",
      available: "Available",
      unavailable: "Unavailable",
      empty: "Create and activate a mailbox before connecting Microsoft Graph.",
    },
    smtp: {
      title: "SMTP",
      description: "Channel used to deliver replies back to the customer.",
      usage: "Usage",
      visibility: "Visibility",
      replyFlow: "Customer replies",
      notExposed: "Not exposed by the current health payload",
      backendManaged: "Backend",
    },
    creativeGears: {
      title: "Creative Gears",
      description: "Availability of the XML delivery integration.",
    },
    system: {
      title: "System",
      description:
        "Primary frontend connection to the API and base configuration.",
      mailProvider: "Inbound provider",
    },
    tabs: {
      general: "General",
      mailboxes: "Mailboxes",
      aiConfig: "AI Config",
      microsoftGraph: "Microsoft Graph",
      automation: "Automation",
      system: "System & integrations",
    },
    general: {
      mailbox: "Mailbox",
      expiresAt: "Expires at",
      status: "Status",
      aiConfidence: "AI confidence details",
      actions: "Actions",
      connectGraph: "Connect Microsoft Graph",
      statusConnected: "Connected",
      statusDisconnected: "Not connected",
      systemStatus: "System & integrations",
    },
  },
  nl: {
    mailboxes: {
      title: "Mailboxes",
      description:
        "Operationeel overzicht van de mailboxen die door de frontend worden gevolgd.",
      active: "Actief",
      total: "Totaal",
      lastSync: "Laatste synchronisatie",
      status: "Status",
      graph: "Microsoft Graph",
      openInbox: "Inbox openen",
      createTitle: "Nieuwe mailbox",
      createDescription:
        "Registreer eerst de mailbox in het systeem en koppel daarna het account in de Microsoft Graph-sectie.",
      createAction: "Mailbox aanmaken",
      createLoading: "Mailbox wordt aangemaakt...",
      createSuccess: "Mailbox aangemaakt",
      createError: "Mailbox aanmaken mislukt",
      renameAction: "Naam wijzigen",
      renameTitle: "Mailbox hernoemen",
      renameSave: "Naam opslaan",
      renameLoading: "Naam wordt opgeslagen...",
      renameSuccess: "Mailboxnaam bijgewerkt",
      renameError: "Mailboxnaam bijwerken mislukt",
      deleteAction: "Verwijderen",
      deleteLoading: "Mailbox wordt verwijderd...",
      deleteSuccess:
        "Mailbox {email} verwijderd. {emails} e-mail(s) en {orders} bestelling(en) verwijderd.",
      deleteError: "Mailbox verwijderen mislukt",
      deleteConfirmTitle: "Deze mailbox verwijderen?",
      deleteConfirmDescription:
        "De mailbox {email} van afdeling {department} wordt permanent verwijderd. Alle e-mails, bijlagen en bestellingen die via deze mailbox zijn gesynchroniseerd worden ook verwijderd.",
      activateAction: "Activeren",
      deactivateAction: "Deactiveren",
      activateLoading: "Mailbox wordt geactiveerd...",
      deactivateLoading: "Mailbox wordt gedeactiveerd...",
      activateSuccess: "Mailbox geactiveerd",
      deactivateSuccess: "Mailbox gedeactiveerd",
      updateError: "Mailbox bijwerken mislukt",
      activeStatus: "Actief",
      inactiveStatus: "Inactief",
      namePlaceholder: "Mailboxnaam",
      emailPlaceholder: "email@bedrijf.com",
      department: "Afdeling",
      empty: "Er zijn nog geen mailboxen geregistreerd.",
      managementTitle: "Mailboxbeheer",
      newMailbox: "Nieuwe mailbox",
      emailLabel: "E-mail",
      aiStatus: "AI-status",
      aiActive: "AI actief",
      aiPaused: "Gepauzeerd",
      graphStatus: "MS Graph-status",
      graphConnected: "MS Graph verbonden",
      graphReconnect: "MS Graph opnieuw koppelen",
      rowActions: "Mailboxacties",
      detailsAction: "Details",
    },
    ai: {
      title: "AI",
      description: "Algemene status van de AI-configuratie.",
      source: "Bron",
      backendManaged: "Beheerd door de backend",
    },
    microsoft: {
      title: "Microsoft Graph",
      description:
        "Verbonden Microsoft-account voor het lezen van e-mails via Graph.",
      status: "Status",
      account: "Account",
      displayName: "Weergavenaam",
      expiresAt: "Verloopt op",
      refreshToken: "Refresh token",
      connectMailbox: "Mailbox koppelen",
      reconnect: "Microsoft opnieuw koppelen",
      connectedMessage: "Microsoft-account succesvol gekoppeld.",
      errorMessage: "Koppelen van Microsoft-account mislukt.",
      available: "Beschikbaar",
      unavailable: "Niet beschikbaar",
      empty: "Maak en activeer eerst een mailbox voordat je Microsoft Graph koppelt.",
    },
    smtp: {
      title: "SMTP",
      description:
        "Kanaal dat wordt gebruikt om antwoorden naar de klant te sturen.",
      usage: "Gebruik",
      visibility: "Zichtbaarheid",
      replyFlow: "Klantantwoorden",
      notExposed: "Niet zichtbaar in de huidige health-payload",
      backendManaged: "Backend",
    },
    creativeGears: {
      title: "Creative Gears",
      description: "Beschikbaarheid van de XML-deliveryintegratie.",
    },
    system: {
      title: "Systeem",
      description:
        "Primaire verbinding van de frontend met de API en basisconfiguratie.",
      mailProvider: "Inkomende provider",
    },
    tabs: {
      general: "Algemeen",
      mailboxes: "Mailboxes",
      aiConfig: "AI-configuratie",
      microsoftGraph: "Microsoft Graph",
      automation: "Automatisering",
      system: "Systeem en integraties",
    },
    general: {
      mailbox: "Mailbox",
      expiresAt: "Verloopt op",
      status: "Status",
      aiConfidence: "AI-betrouwbaarheidsdetails",
      actions: "Acties",
      connectGraph: "Microsoft Graph koppelen",
      statusConnected: "Verbonden",
      statusDisconnected: "Niet verbonden",
      systemStatus: "Systeem en integraties",
    },
  },
};
