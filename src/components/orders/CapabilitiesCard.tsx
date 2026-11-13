'use client';

import {useState} from 'react';
import {useLocale} from 'next-intl';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {Check, Plus, SquarePen, Tag, Trash2, X} from 'lucide-react';

import type {Locale} from '@/i18n/routing';
import type {
  CapabilityLink,
  OrderCapability,
  OrderCapabilityInput
} from '@/types';
import {
  createOrderCapability,
  deleteOrderCapability,
  updateOrderCapability
} from '@/lib/api';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const LINKS: CapabilityLink[] = ['required', 'available', 'forbidden'];

export function CapabilitiesCard({
  orderId,
  capabilities
}: {
  orderId: string;
  capabilities: OrderCapability[];
}) {
  const locale = useLocale() as Locale;
  const t = labels[locale] ?? labels.en;
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({queryKey: ['orders', orderId]});

  const createM = useMutation({
    mutationFn: (input: OrderCapabilityInput) =>
      createOrderCapability(orderId, input),
    onSuccess: async () => {
      setAdding(false);
      toast.success(t.saved);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const updateM = useMutation({
    mutationFn: (v: {id: string; input: OrderCapabilityInput}) =>
      updateOrderCapability(orderId, v.id, v.input),
    onSuccess: async () => {
      setEditingId(null);
      toast.success(t.saved);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteOrderCapability(orderId, id),
    onSuccess: async () => {
      toast.success(t.deleted);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const linkLabel = (link: string) =>
    t.links[link as CapabilityLink] ?? link;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {t.title}
          <Badge variant="outline">{capabilities.length}</Badge>
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          disabled={adding}
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t.add}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">{t.capability}</TableHead>
                <TableHead className="min-w-[120px]">{t.link}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilities.map((cap) =>
                editingId === cap.id ? (
                  <EditRow
                    key={cap.id}
                    initial={cap}
                    labels={t}
                    pending={updateM.isPending}
                    onCancel={() => setEditingId(null)}
                    onSave={(input) => updateM.mutate({id: cap.id, input})}
                  />
                ) : (
                  <TableRow key={cap.id}>
                    <TableCell className="text-sm [overflow-wrap:anywhere]">
                      {cap.capability}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {linkLabel(cap.link)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-muted-foreground/70 hover:text-foreground"
                          title={t.edit}
                          onClick={() => {
                            setAdding(false);
                            setEditingId(cap.id);
                          }}
                        >
                          <SquarePen className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-muted-foreground/70 hover:text-destructive"
                          title={t.remove}
                          disabled={deleteM.isPending}
                          onClick={() => deleteM.mutate(cap.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}

              {adding ? (
                <EditRow
                  initial={null}
                  labels={t}
                  pending={createM.isPending}
                  onCancel={() => setAdding(false)}
                  onSave={(input) => createM.mutate(input)}
                />
              ) : null}

              {!capabilities.length && !adding ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {t.empty}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function EditRow({
  initial,
  labels: t,
  pending,
  onCancel,
  onSave
}: {
  initial: OrderCapability | null;
  labels: (typeof labels)['en'];
  pending: boolean;
  onCancel: () => void;
  onSave: (input: OrderCapabilityInput) => void;
}) {
  const [capability, setCapability] = useState(initial?.capability ?? '');
  const [link, setLink] = useState<CapabilityLink>(initial?.link ?? 'required');

  const submit = () => {
    if (!capability.trim()) {
      toast.error(t.needValue);
      return;
    }
    onSave({capability: capability.trim(), link});
  };

  return (
    <TableRow className="bg-muted/20 align-top hover:bg-muted/20">
      <TableCell>
        <Input
          autoFocus
          className="h-8 min-w-0 text-sm"
          placeholder={t.placeholder}
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
      </TableCell>
      <TableCell>
        <select
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={link}
          onChange={(e) => setLink(e.target.value as CapabilityLink)}
        >
          {LINKS.map((l) => (
            <option key={l} value={l}>
              {t.links[l]}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-8 w-8"
            disabled={pending}
            title={t.save}
            onClick={submit}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8"
            title={t.cancel}
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const labels: Record<
  Locale,
  {
    title: string;
    add: string;
    capability: string;
    link: string;
    placeholder: string;
    empty: string;
    edit: string;
    remove: string;
    save: string;
    cancel: string;
    saved: string;
    deleted: string;
    error: string;
    needValue: string;
    links: Record<CapabilityLink, string>;
  }
> = {
  pt: {
    title: 'Características (kenmerken)',
    add: 'Adicionar',
    capability: 'Característica',
    link: 'Vínculo',
    placeholder: 'ex.: Plataforma elevatória, ADR, Temperatura',
    empty: 'Nenhuma característica. Adicione manualmente.',
    edit: 'Editar',
    remove: 'Remover',
    save: 'Salvar',
    cancel: 'Cancelar',
    saved: 'Característica salva',
    deleted: 'Característica removida',
    error: 'Algo deu errado',
    needValue: 'Informe a característica',
    links: {required: 'Obrigatória', available: 'Disponível', forbidden: 'Proibida'}
  },
  en: {
    title: 'Capabilities (kenmerken)',
    add: 'Add',
    capability: 'Capability',
    link: 'Link',
    placeholder: 'e.g. Tail-lift, ADR, Temperature',
    empty: 'No capabilities. Add them manually.',
    edit: 'Edit',
    remove: 'Remove',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Capability saved',
    deleted: 'Capability removed',
    error: 'Something went wrong',
    needValue: 'Enter the capability',
    links: {required: 'Required', available: 'Available', forbidden: 'Forbidden'}
  },
  nl: {
    title: 'Kenmerken',
    add: 'Toevoegen',
    capability: 'Kenmerk',
    link: 'Koppeling',
    placeholder: 'bijv. Laadklep, ADR, Temperatuur',
    empty: 'Geen kenmerken. Voeg ze handmatig toe.',
    edit: 'Bewerken',
    remove: 'Verwijderen',
    save: 'Opslaan',
    cancel: 'Annuleren',
    saved: 'Kenmerk opgeslagen',
    deleted: 'Kenmerk verwijderd',
    error: 'Er ging iets mis',
    needValue: 'Vul het kenmerk in',
    links: {required: 'Vereist', available: 'Beschikbaar', forbidden: 'Verboden'}
  }
};
