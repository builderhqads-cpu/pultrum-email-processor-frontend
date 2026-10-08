'use client';

import {useState} from 'react';
import {useLocale} from 'next-intl';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {Check, Package, Plus, SquarePen, Trash2, X} from 'lucide-react';

import type {Locale} from '@/i18n/routing';
import type {OrderGoodsLine, OrderGoodsLineInput} from '@/types';
import {
  createOrderGoodsLine,
  deleteOrderGoodsLine,
  updateOrderGoodsLine
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

const num = (v: number | null | undefined) =>
  v == null ? '—' : String(v).replace('.', ',');

function dims(l: OrderGoodsLine): string {
  if (l.length == null && l.width == null && l.height == null) return '—';
  const p = (v: number | null) => (v == null ? '·' : String(v).replace('.', ','));
  return `${p(l.length)} × ${p(l.width)} × ${p(l.height)}`;
}

export function GoodsLinesCard({
  orderId,
  lines
}: {
  orderId: string;
  lines: OrderGoodsLine[];
}) {
  const locale = useLocale() as Locale;
  const t = labels[locale] ?? labels.en;
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({queryKey: ['orders', orderId]});

  const createM = useMutation({
    mutationFn: (input: OrderGoodsLineInput) =>
      createOrderGoodsLine(orderId, input),
    onSuccess: async () => {
      setAdding(false);
      toast.success(t.saved);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const updateM = useMutation({
    mutationFn: (v: {lineId: string; input: OrderGoodsLineInput}) =>
      updateOrderGoodsLine(orderId, v.lineId, v.input),
    onSuccess: async () => {
      setEditingId(null);
      toast.success(t.saved);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const deleteM = useMutation({
    mutationFn: (lineId: string) => deleteOrderGoodsLine(orderId, lineId),
    onSuccess: async () => {
      toast.success(t.deleted);
      await invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t.error)
  });

  const colCount = 7;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-muted-foreground" />
          {t.title}
          <Badge variant="outline">{lines.length}</Badge>
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
                <TableHead className="w-16 text-right">{t.qty}</TableHead>
                <TableHead className="min-w-[120px]">{t.packaging}</TableHead>
                <TableHead className="min-w-[130px]">{t.dims}</TableHead>
                <TableHead className="w-24 text-right">{t.weight}</TableHead>
                <TableHead className="min-w-[110px]">{t.barcode}</TableHead>
                <TableHead className="min-w-[140px]">{t.description}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) =>
                editingId === line.id ? (
                  <EditRow
                    key={line.id}
                    initial={line}
                    labels={t}
                    pending={updateM.isPending}
                    onCancel={() => setEditingId(null)}
                    onSave={(input) => updateM.mutate({lineId: line.id, input})}
                  />
                ) : (
                  <TableRow key={line.id}>
                    <TableCell className="text-right tabular-nums">
                      {num(line.quantity)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {line.packagingType || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {dims(line)}
                      {line.length != null || line.width != null || line.height != null
                        ? ' cm'
                        : ''}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.weightPerUnit == null ? '—' : `${num(line.weightPerUnit)} kg`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {line.barcode || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                      {line.productDescription || '—'}
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
                            setEditingId(line.id);
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
                          onClick={() => deleteM.mutate(line.id)}
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

              {!lines.length && !adding ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={colCount}
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
  initial: OrderGoodsLine | null;
  labels: (typeof labels)['en'];
  pending: boolean;
  onCancel: () => void;
  onSave: (input: OrderGoodsLineInput) => void;
}) {
  const [draft, setDraft] = useState<OrderGoodsLineInput>({
    quantity: initial?.quantity ?? '',
    packagingType: initial?.packagingType ?? '',
    length: initial?.length ?? '',
    width: initial?.width ?? '',
    height: initial?.height ?? '',
    weightPerUnit: initial?.weightPerUnit ?? '',
    barcode: initial?.barcode ?? '',
    productDescription: initial?.productDescription ?? ''
  });

  const set = (k: keyof OrderGoodsLineInput, v: string) =>
    setDraft((d) => ({...d, [k]: v}));

  const cell = 'h-8 min-w-0 text-sm';

  return (
    <TableRow className="bg-muted/20 align-top hover:bg-muted/20">
      <TableCell>
        <Input
          autoFocus
          inputMode="numeric"
          className={`${cell} w-14 text-right`}
          value={String(draft.quantity ?? '')}
          onChange={(e) => set('quantity', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          placeholder={t.packaging}
          value={String(draft.packagingType ?? '')}
          onChange={(e) => set('packagingType', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input className={`${cell} w-12`} placeholder="C" value={String(draft.length ?? '')} onChange={(e) => set('length', e.target.value)} />
          <span className="text-muted-foreground">×</span>
          <Input className={`${cell} w-12`} placeholder="L" value={String(draft.width ?? '')} onChange={(e) => set('width', e.target.value)} />
          <span className="text-muted-foreground">×</span>
          <Input className={`${cell} w-12`} placeholder="A" value={String(draft.height ?? '')} onChange={(e) => set('height', e.target.value)} />
        </div>
      </TableCell>
      <TableCell>
        <Input
          inputMode="decimal"
          className={`${cell} w-20 text-right`}
          value={String(draft.weightPerUnit ?? '')}
          onChange={(e) => set('weightPerUnit', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          placeholder={t.barcode}
          value={String(draft.barcode ?? '')}
          onChange={(e) => set('barcode', e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Input
          className={cell}
          placeholder={t.description}
          value={String(draft.productDescription ?? '')}
          onChange={(e) => set('productDescription', e.target.value)}
        />
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
            onClick={() => onSave(draft)}
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
    qty: string;
    packaging: string;
    dims: string;
    weight: string;
    barcode: string;
    description: string;
    empty: string;
    edit: string;
    remove: string;
    save: string;
    cancel: string;
    saved: string;
    deleted: string;
    error: string;
  }
> = {
  pt: {
    title: 'Mercadorias (linhas)',
    add: 'Adicionar linha',
    qty: 'Qtd',
    packaging: 'Embalagem',
    dims: 'C × L × A (cm)',
    weight: 'Peso/un',
    barcode: 'Código de barras',
    description: 'Descrição',
    empty: 'Nenhuma linha de mercadoria. Adicione manualmente.',
    edit: 'Editar',
    remove: 'Remover',
    save: 'Salvar',
    cancel: 'Cancelar',
    saved: 'Linha salva',
    deleted: 'Linha removida',
    error: 'Algo deu errado'
  },
  en: {
    title: 'Goods (lines)',
    add: 'Add line',
    qty: 'Qty',
    packaging: 'Packaging',
    dims: 'L × W × H (cm)',
    weight: 'Weight/unit',
    barcode: 'Barcode',
    description: 'Description',
    empty: 'No goods lines. Add them manually.',
    edit: 'Edit',
    remove: 'Remove',
    save: 'Save',
    cancel: 'Cancel',
    saved: 'Line saved',
    deleted: 'Line removed',
    error: 'Something went wrong'
  },
  nl: {
    title: 'Goederen (regels)',
    add: 'Regel toevoegen',
    qty: 'Aantal',
    packaging: 'Verpakking',
    dims: 'L × B × H (cm)',
    weight: 'Gewicht/stuk',
    barcode: 'Barcode',
    description: 'Omschrijving',
    empty: 'Geen goederenregels. Voeg ze handmatig toe.',
    edit: 'Bewerken',
    remove: 'Verwijderen',
    save: 'Opslaan',
    cancel: 'Annuleren',
    saved: 'Regel opgeslagen',
    deleted: 'Regel verwijderd',
    error: 'Er ging iets mis'
  }
};
