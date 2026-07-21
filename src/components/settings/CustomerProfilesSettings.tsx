'use client';

import {useMemo, useState} from 'react';
import {Pencil, Plus, Trash2, Users} from 'lucide-react';
import {useLocale} from 'next-intl';
import {toast} from 'sonner';

import {useCustomerProfileFieldCatalog, useCustomerProfiles} from '@/hooks/use-customer-profiles';
import {
  useCreateCustomerProfile,
  useDeleteCustomerProfile,
  useUpdateCustomerProfile
} from '@/hooks/use-manage-customer-profiles';
import type {
  CustomerProfile,
  CustomerProfileCatalogField,
  CustomerProfileMutationInput,
  FieldRequirement
} from '@/types';
import type {Locale} from '@/i18n/routing';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {EmptyState} from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {cn} from '@/lib/utils';
import {fieldLabel} from '@/components/orders/field-labels';

type CustomerProfileFieldGroup = 'pickup' | 'delivery' | 'cargo' | 'general';
type RequirementKey = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';

type FormState = {
  name: string;
  contactEmail: string;
  additionalContactEmails: string;
  active: boolean;
  notes: string;
  fields: Record<string, string>;
  /** Free-text guidance for the AI on how this customer builds their documents. */
  aiInstructions: string;
};

const fieldGroupOrder: CustomerProfileFieldGroup[] = [
  'pickup',
  'delivery',
  'cargo',
  'general'
];

const emptyFormState = (): FormState => ({
  name: '',
  contactEmail: '',
  additionalContactEmails: '',
  active: true,
  notes: '',
  fields: {},
  aiInstructions: ''
});

export function CustomerProfilesSettings() {
  const locale = useLocale() as Locale;
  const labels = customerProfileLabels[locale] ?? customerProfileLabels.en;
  const customerProfiles = useCustomerProfiles();
  const fieldCatalog = useCustomerProfileFieldCatalog();
  const createCustomerProfile = useCreateCustomerProfile();
  const updateCustomerProfile = useUpdateCustomerProfile();
  const deleteCustomerProfile = useDeleteCustomerProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CustomerProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState);

  const groupedCatalog = useMemo(() => {
    const groups: Record<CustomerProfileFieldGroup, CustomerProfileCatalogField[]> = {
      pickup: [],
      delivery: [],
      cargo: [],
      general: []
    };

    for (const field of fieldCatalog.data ?? []) {
      const group = normalizeGroup(field.group);
      groups[group].push(field);
    }

    return groups;
  }, [fieldCatalog.data]);

  function openCreateDialog() {
    setEditingProfile(null);
    setForm(emptyFormState());
    setDialogOpen(true);
  }

  function openEditDialog(profile: CustomerProfile) {
    setEditingProfile(profile);
    setForm({
      name: profile.name,
      contactEmail: profile.contactEmail,
      additionalContactEmails: profile.additionalContactEmails.join('\n'),
      active: profile.active,
      notes: profile.notes ?? '',
      fields: Object.fromEntries(
        (profile.fields ?? []).map((field) => [field.key, field.value ?? ''])
      ),
      aiInstructions: profile.aiInstructions ?? ''
    });
    setDialogOpen(true);
  }

  function updateFieldValue(key: keyof Omit<FormState, 'fields'>, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateProfileField(key: string, value: string) {
    setForm((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [key]: value
      }
    }));
  }

  function buildPayload(): CustomerProfileMutationInput {
    return {
      name: form.name.trim(),
      contactEmail: form.contactEmail.trim(),
      additionalContactEmails: parseEmailLines(form.additionalContactEmails),
      active: form.active,
      notes: form.notes.trim() || null,
      aiInstructions: form.aiInstructions.trim() || null,
      fields: Object.entries(form.fields)
        .map(([key, value]) => ({ key, value: value.trim() }))
        .filter((field) => field.value.length > 0)
    };
  }

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload.name || !payload.contactEmail) return;

    const toastId = toast.loading(
      editingProfile ? labels.updateLoading : labels.createLoading
    );

    try {
      if (editingProfile) {
        await updateCustomerProfile.mutateAsync({
          customerProfileId: editingProfile.id,
          payload
        });
        toast.success(labels.updateSuccess, {id: toastId});
      } else {
        await createCustomerProfile.mutateAsync(payload);
        toast.success(labels.createSuccess, {id: toastId});
      }

      setDialogOpen(false);
      setEditingProfile(null);
      setForm(emptyFormState());
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message ?? (editingProfile ? labels.updateError : labels.createError), {
        id: toastId
      });
    }
  }

  async function handleDelete(profile: CustomerProfile) {
    const toastId = toast.loading(labels.deleteLoading);
    try {
      await deleteCustomerProfile.mutateAsync(profile.id);
      toast.success(labels.deleteSuccess.replace('{email}', profile.contactEmail), {
        id: toastId
      });
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toast.error(message ?? labels.deleteError, {id: toastId});
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{labels.title}</h2>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          {labels.newProfile}
        </Button>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{labels.managementTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {customerProfiles.isLoading ? (
            <div className="text-sm text-muted-foreground">{labels.loading}</div>
          ) : customerProfiles.error ? (
            <div className="text-sm text-destructive">{String(customerProfiles.error.message)}</div>
          ) : !(customerProfiles.data?.length) ? (
            <EmptyState
              icon={Users}
              title={labels.emptyTitle}
              description={labels.emptyDescription}
              action={<Button onClick={openCreateDialog}>{labels.newProfile}</Button>}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.columns.customer}</TableHead>
                    <TableHead>{labels.columns.status}</TableHead>
                    <TableHead>{labels.columns.defaults}</TableHead>
                    <TableHead>{labels.columns.updatedAt}</TableHead>
                    <TableHead className="text-right">{labels.columns.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerProfiles.data?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{profile.name}</div>
                        <div className="text-xs text-muted-foreground">{profile.contactEmail}</div>
                        {profile.additionalContactEmails.length ? (
                          <div className="text-xs text-muted-foreground">
                            +{profile.additionalContactEmails.length} {labels.additionalEmailsCount}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            profile.active
                              ? 'border-emerald-300/80 bg-emerald-100 text-emerald-950'
                              : 'border-border bg-muted text-foreground'
                          )}
                        >
                          {profile.active ? labels.active : labels.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>{profile.fields.length}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(profile.updatedAt, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(profile)}>
                            <Pencil className="h-4 w-4" />
                            {labels.edit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(profile)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {labels.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProfile(null);
            setForm(emptyFormState());
          }
        }}
      >
        <DialogContent className="h-[92vh] !w-[96vw] !max-w-[96vw] overflow-x-hidden overflow-y-auto p-4 sm:p-6 2xl:!w-[1440px] 2xl:!max-w-[1440px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? labels.editTitle : labels.createTitle}
            </DialogTitle>
            <DialogDescription>
              {editingProfile ? labels.editDescription : labels.createDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-w-0 gap-6 overflow-x-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="min-w-0 space-y-4 xl:sticky xl:top-0 xl:self-start">
              <Card className="min-w-0 overflow-hidden">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">{labels.form.name}</label>
                      <Input
                        value={form.name}
                        onChange={(event) => updateFieldValue('name', event.target.value)}
                        placeholder={labels.form.namePlaceholder}
                        className="min-w-0"
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">{labels.form.contactEmail}</label>
                      <Input
                        value={form.contactEmail}
                        onChange={(event) => updateFieldValue('contactEmail', event.target.value)}
                        placeholder={labels.form.contactEmailPlaceholder}
                        className="min-w-0"
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        {labels.form.additionalContactEmails}
                      </label>
                      <Textarea
                        value={form.additionalContactEmails}
                        onChange={(event) =>
                          updateFieldValue('additionalContactEmails', event.target.value)
                        }
                        placeholder={labels.form.additionalContactEmailsPlaceholder}
                        className="min-h-24 min-w-0"
                      />
                      <p className="text-xs text-muted-foreground">
                        {labels.form.additionalContactEmailsHint}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{labels.form.status}</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={form.active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFieldValue('active', true)}
                      >
                        {labels.active}
                      </Button>
                      <Button
                        type="button"
                        variant={!form.active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFieldValue('active', false)}
                      >
                        {labels.inactive}
                      </Button>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{labels.form.notes}</label>
                    <Textarea
                      value={form.notes}
                      onChange={(event) => updateFieldValue('notes', event.target.value)}
                      placeholder={labels.form.notesPlaceholder}
                      className="min-h-32 min-w-0"
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {labels.form.aiInstructions}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {labels.form.aiInstructionsHelp}
                    </p>
                    <Textarea
                      value={form.aiInstructions}
                      onChange={(event) =>
                        updateFieldValue('aiInstructions', event.target.value)
                      }
                      placeholder={labels.form.aiInstructionsPlaceholder}
                      className="min-h-48 min-w-0"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0">
              {fieldCatalog.isLoading ? (
                <div className="text-sm text-muted-foreground">{labels.loadingCatalog}</div>
              ) : fieldCatalog.error ? (
                <div className="text-sm text-destructive">{String(fieldCatalog.error.message)}</div>
              ) : (
                <div className="space-y-4">
                  {fieldGroupOrder.map((group) => {
                    const items = groupedCatalog[group];
                    if (!items?.length) return null;

                    return (
                      <Card key={group} className="min-w-0 overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{labels.groups[group]}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-3">
                            {items.map((field) => {
                              const requirement = normalizeRequirement(field.requirement);
                              const badgeClassName =
                                requirement === 'REQUIRED'
                                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                  : requirement === 'RECOMMENDED'
                                    ? 'border-blue-300/80 bg-blue-100 text-blue-950'
                                    : 'border-border bg-muted text-muted-foreground';

                              return (
                                <div key={field.key} className="min-w-0 overflow-hidden space-y-2 rounded-lg border p-3">
                                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                                      {fieldLabel(field.key, locale, field.label)}
                                    </div>
                                  </div>
                                    <Badge
                                      variant="outline"
                                      className={cn('max-w-full shrink-0 whitespace-nowrap', badgeClassName)}
                                    >
                                      {labels.requirements[requirement]}
                                    </Badge>
                                  </div>
                                  <Input
                                    value={form.fields[field.key] ?? ''}
                                    onChange={(event) => updateProfileField(field.key, event.target.value)}
                                    placeholder={labels.form.fieldPlaceholder}
                                    className="min-w-0"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>{labels.cancel}</DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name.trim() ||
                !form.contactEmail.trim() ||
                createCustomerProfile.isPending ||
                updateCustomerProfile.isPending
              }
            >
              {createCustomerProfile.isPending || updateCustomerProfile.isPending
                ? labels.saving
                : editingProfile
                  ? labels.save
                  : labels.create}
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
            <AlertDialogTitle>{labels.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? labels.deleteConfirmDescription
                    .replace('{name}', deleteTarget.name)
                    .replace('{email}', deleteTarget.contactEmail)
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void handleDelete(deleteTarget);
              }}
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function normalizeGroup(group: string): CustomerProfileFieldGroup {
  if (group === 'pickup' || group === 'delivery' || group === 'cargo') return group;
  return 'general';
}

function parseEmailLines(value: string) {
  return [...new Set(
    value
      .split(/[\n,;]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  )];
}

function normalizeRequirement(requirement: string): RequirementKey {
  const normalized = ((requirement || 'OPTIONAL').trim().toUpperCase() || 'OPTIONAL') as FieldRequirement;

  if (normalized === 'REQUIRED') return 'REQUIRED';
  if (normalized === 'RECOMMENDED') return 'RECOMMENDED';
  return 'OPTIONAL';
}

function formatDateTime(value: string | null | undefined, locale: Locale) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

const customerProfileLabels: Record<
  Locale,
  {
    title: string;
    description: string;
    managementTitle: string;
    newProfile: string;
    loading: string;
    loadingCatalog: string;
    emptyTitle: string;
    emptyDescription: string;
    active: string;
    inactive: string;
    additionalEmailsCount: string;
    edit: string;
    delete: string;
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
    create: string;
    save: string;
    saving: string;
    cancel: string;
    createLoading: string;
    createSuccess: string;
    createError: string;
    updateLoading: string;
    updateSuccess: string;
    updateError: string;
    deleteLoading: string;
    deleteSuccess: string;
    deleteError: string;
    deleteConfirmTitle: string;
    deleteConfirmDescription: string;
    columns: {
      customer: string;
      status: string;
      defaults: string;
      updatedAt: string;
      actions: string;
    };
    form: {
      name: string;
      namePlaceholder: string;
      contactEmail: string;
      contactEmailPlaceholder: string;
      additionalContactEmails: string;
      additionalContactEmailsPlaceholder: string;
      additionalContactEmailsHint: string;
      status: string;
      notes: string;
      notesPlaceholder: string;
      fieldPlaceholder: string;
      aiInstructions: string;
      aiInstructionsHelp: string;
      aiInstructionsPlaceholder: string;
    };
    groups: Record<CustomerProfileFieldGroup, string>;
    requirements: Record<RequirementKey, string>;
  }
> = {
  pt: {
    title: 'Perfis de clientes',
    description:
      'Cadastre dados padrao por cliente para preencher campos antes do processamento pela IA.',
    managementTitle: 'Gestao de perfis de clientes',
    newProfile: 'Novo cliente',
    loading: 'Carregando perfis...',
    loadingCatalog: 'Carregando catalogo de campos...',
    emptyTitle: 'Nenhum perfil de cliente cadastrado',
    emptyDescription:
      'Crie um perfil para reaproveitar enderecos, contatos e informacoes fixas antes da IA.',
    active: 'Ativo',
    inactive: 'Inativo',
    additionalEmailsCount: 'emails extras',
    edit: 'Editar',
    delete: 'Excluir',
    createTitle: 'Novo perfil de cliente',
    createDescription:
      'Esses campos serao usados como defaults quando chegar um novo email desse contato.',
    editTitle: 'Editar perfil de cliente',
    editDescription: 'Atualize os dados padrao que o sistema usa antes da IA.',
    create: 'Criar perfil',
    save: 'Salvar alteracoes',
    saving: 'Salvando...',
    cancel: 'Cancelar',
    createLoading: 'Criando perfil...',
    createSuccess: 'Perfil de cliente criado',
    createError: 'Falha ao criar perfil de cliente',
    updateLoading: 'Atualizando perfil...',
    updateSuccess: 'Perfil de cliente atualizado',
    updateError: 'Falha ao atualizar perfil de cliente',
    deleteLoading: 'Excluindo perfil...',
    deleteSuccess: 'Perfil {email} excluido',
    deleteError: 'Falha ao excluir perfil de cliente',
    deleteConfirmTitle: 'Excluir este perfil?',
    deleteConfirmDescription:
      'O perfil {name} ({email}) sera removido permanentemente.',
    columns: {
      customer: 'Cliente',
      status: 'Status',
      defaults: 'Campos padrao',
      updatedAt: 'Atualizado em',
      actions: 'Acoes'
    },
    form: {
      name: 'Nome do cliente',
      namePlaceholder: 'Ex.: ACME Logistics',
      contactEmail: 'Email de contato',
      contactEmailPlaceholder: 'cliente@empresa.com',
      additionalContactEmails: 'Emails adicionais',
      additionalContactEmailsPlaceholder: 'compras@empresa.com\nlogistica@empresa.com',
      additionalContactEmailsHint: 'Um email por linha. Eles tambem serao reconhecidos para carregar este perfil.',
      status: 'Status',
      notes: 'Observacoes',
      notesPlaceholder: 'Notas internas sobre esse cliente.',
      fieldPlaceholder: 'Valor padrao',
      aiInstructions: 'Instrucoes para a IA',
      aiInstructionsHelp:
        'Explique como este cliente monta os documentos: onde fica cada dado e as regras dele. Enviado junto com o e-mail para a IA.',
      aiInstructionsPlaceholder: `Ex.:
Referencia de coleta: o numero que aparece no topo do documento, ao lado do titulo
Data de entrega: sempre na segunda coluna da tabela
Cada linha da planilha e uma ordem separada
Ignorar os dados do rodape (assinatura e contatos)`
    },
    groups: {
      pickup: 'Pickup / Coleta',
      delivery: 'Delivery / Entrega',
      cargo: 'Carga / Comercial',
      general: 'Geral'
    },
    requirements: {
      REQUIRED: 'Obrigatorio',
      RECOMMENDED: 'Recomendado',
      OPTIONAL: 'Opcional'
    }
  },
  en: {
    title: 'Customer profiles',
    description:
      'Store customer defaults to prefill order fields before AI processes the email.',
    managementTitle: 'Customer profile management',
    newProfile: 'New customer',
    loading: 'Loading profiles...',
    loadingCatalog: 'Loading field catalog...',
    emptyTitle: 'No customer profiles yet',
    emptyDescription:
      'Create a profile to reuse addresses, contacts, and fixed data before AI extraction.',
    active: 'Active',
    inactive: 'Inactive',
    additionalEmailsCount: 'additional emails',
    edit: 'Edit',
    delete: 'Delete',
    createTitle: 'New customer profile',
    createDescription:
      'These values will be used as defaults when a new email arrives from this contact.',
    editTitle: 'Edit customer profile',
    editDescription: 'Update the default data applied before AI extraction.',
    create: 'Create profile',
    save: 'Save changes',
    saving: 'Saving...',
    cancel: 'Cancel',
    createLoading: 'Creating profile...',
    createSuccess: 'Customer profile created',
    createError: 'Failed to create customer profile',
    updateLoading: 'Updating profile...',
    updateSuccess: 'Customer profile updated',
    updateError: 'Failed to update customer profile',
    deleteLoading: 'Deleting profile...',
    deleteSuccess: 'Profile {email} deleted',
    deleteError: 'Failed to delete customer profile',
    deleteConfirmTitle: 'Delete this profile?',
    deleteConfirmDescription:
      'The profile {name} ({email}) will be permanently removed.',
    columns: {
      customer: 'Customer',
      status: 'Status',
      defaults: 'Default fields',
      updatedAt: 'Updated at',
      actions: 'Actions'
    },
    form: {
      name: 'Customer name',
      namePlaceholder: 'Example: ACME Logistics',
      contactEmail: 'Contact email',
      contactEmailPlaceholder: 'customer@company.com',
      additionalContactEmails: 'Additional emails',
      additionalContactEmailsPlaceholder: 'purchasing@company.com\nlogistics@company.com',
      additionalContactEmailsHint: 'One email per line. These addresses will also match this customer profile.',
      status: 'Status',
      notes: 'Notes',
      notesPlaceholder: 'Internal notes about this customer.',
      fieldPlaceholder: 'Default value',
      aiInstructions: 'AI instructions',
      aiInstructionsHelp:
        'Describe how this customer builds their documents: where each value lives and their rules. Sent to the AI along with the email.',
      aiInstructionsPlaceholder: `E.g.:
Pickup reference: the number at the top of the document, next to the title
Delivery date: always in the second column of the table
Each row of the spreadsheet is a separate order
Ignore the footer details (signature and contacts)`
    },
    groups: {
      pickup: 'Pickup',
      delivery: 'Delivery',
      cargo: 'Cargo / commercial',
      general: 'General'
    },
    requirements: {
      REQUIRED: 'Required',
      RECOMMENDED: 'Recommended',
      OPTIONAL: 'Optional'
    }
  },
  nl: {
    title: 'Klantprofielen',
    description:
      'Bewaar klantdefaults om ordervelden alvast te vullen voordat de AI de e-mail verwerkt.',
    managementTitle: 'Beheer van klantprofielen',
    newProfile: 'Nieuwe klant',
    loading: 'Profielen laden...',
    loadingCatalog: 'Veldcatalogus laden...',
    emptyTitle: 'Nog geen klantprofielen',
    emptyDescription:
      'Maak een profiel om adressen, contactpersonen en vaste gegevens vooraf te hergebruiken.',
    active: 'Actief',
    inactive: 'Inactief',
    additionalEmailsCount: 'extra e-mails',
    edit: 'Bewerken',
    delete: 'Verwijderen',
    createTitle: 'Nieuw klantprofiel',
    createDescription:
      'Deze waarden worden als defaults gebruikt wanneer een nieuwe e-mail van dit contact binnenkomt.',
    editTitle: 'Klantprofiel bewerken',
    editDescription: 'Werk de standaardgegevens bij die voor de AI worden toegepast.',
    create: 'Profiel aanmaken',
    save: 'Wijzigingen opslaan',
    saving: 'Opslaan...',
    cancel: 'Annuleren',
    createLoading: 'Profiel aanmaken...',
    createSuccess: 'Klantprofiel aangemaakt',
    createError: 'Klantprofiel aanmaken mislukt',
    updateLoading: 'Profiel bijwerken...',
    updateSuccess: 'Klantprofiel bijgewerkt',
    updateError: 'Klantprofiel bijwerken mislukt',
    deleteLoading: 'Profiel verwijderen...',
    deleteSuccess: 'Profiel {email} verwijderd',
    deleteError: 'Klantprofiel verwijderen mislukt',
    deleteConfirmTitle: 'Dit profiel verwijderen?',
    deleteConfirmDescription:
      'Het profiel {name} ({email}) wordt permanent verwijderd.',
    columns: {
      customer: 'Klant',
      status: 'Status',
      defaults: 'Standaardvelden',
      updatedAt: 'Bijgewerkt op',
      actions: 'Acties'
    },
    form: {
      name: 'Klantnaam',
      namePlaceholder: 'Bijv. ACME Logistics',
      contactEmail: 'Contact e-mail',
      contactEmailPlaceholder: 'klant@bedrijf.com',
      additionalContactEmails: 'Extra e-mails',
      additionalContactEmailsPlaceholder: 'inkoop@bedrijf.com\nlogistiek@bedrijf.com',
      additionalContactEmailsHint: 'Een e-mailadres per regel. Deze adressen worden ook herkend voor dit klantprofiel.',
      status: 'Status',
      notes: 'Notities',
      notesPlaceholder: 'Interne notities over deze klant.',
      fieldPlaceholder: 'Standaardwaarde',
      aiInstructions: 'AI-instructies',
      aiInstructionsHelp:
        'Beschrijf hoe deze klant de documenten opbouwt: waar elk gegeven staat en welke regels gelden. Wordt met de e-mail naar de AI gestuurd.',
      aiInstructionsPlaceholder: `Bijv.:
Laadreferentie: het nummer bovenaan het document, naast de titel
Losdatum: altijd in de tweede kolom van de tabel
Elke regel van het overzicht is een aparte order
Negeer de gegevens in de voettekst (handtekening en contacten)`
    },
    groups: {
      pickup: 'Laden',
      delivery: 'Lossen',
      cargo: 'Lading / commercieel',
      general: 'Algemeen'
    },
    requirements: {
      REQUIRED: 'Verplicht',
      RECOMMENDED: 'Aanbevolen',
      OPTIONAL: 'Optioneel'
    }
  }
};
