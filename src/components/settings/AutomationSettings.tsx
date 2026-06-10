'use client';

import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import {toast} from 'sonner';
import {Check} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';
import {useAutomationSettings} from '@/hooks/use-automation-settings';
import type {DeliveryMode, SyncMode, UpdateAutomationSettings} from '@/lib/api';
import type {Locale} from '@/i18n/routing';

export function AutomationSettings() {
  const locale = useLocale() as Locale;
  const labels = automationLabels[locale] ?? automationLabels.en;
  const {data, loading, update} = useAutomationSettings();
  const [threshold, setThreshold] = useState('0.90');

  useEffect(() => {
    if (data) setThreshold(String(data.autoXmlConfidenceThreshold));
  }, [data?.autoXmlConfidenceThreshold, data]);

  function applyUpdate(payload: UpdateAutomationSettings) {
    const toastId = toast.loading(labels.saving);
    update.mutate(payload, {
      onSuccess: () => toast.success(labels.saved, {id: toastId}),
      onError: (err) =>
        toast.error(err?.message ?? labels.error, {id: toastId})
    });
  }

  if (loading || !data) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  function saveThreshold() {
    const value = Number(threshold.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      toast.error(labels.thresholdInvalid);
      return;
    }
    applyUpdate({autoXmlConfidenceThreshold: value});
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Email sync */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{labels.sync.title}</CardTitle>
          <div className="text-sm text-muted-foreground">{labels.sync.description}</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['MANUAL', 'AUTOMATIC'] as SyncMode[]).map((mode) => (
              <OptionTile
                key={mode}
                active={data.syncMode === mode}
                title={labels.sync.modes[mode].title}
                description={labels.sync.modes[mode].description}
                disabled={update.isPending}
                onClick={() => {
                  if (data.syncMode !== mode) applyUpdate({syncMode: mode});
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order delivery */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{labels.delivery.title}</CardTitle>
          <div className="text-sm text-muted-foreground">{labels.delivery.description}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['MANUAL', 'SELECTIVE', 'AUTONOMOUS'] as DeliveryMode[]).map((mode) => (
              <OptionTile
                key={mode}
                active={data.deliveryMode === mode}
                title={labels.delivery.modes[mode].title}
                description={labels.delivery.modes[mode].description}
                disabled={update.isPending}
                onClick={() => {
                  if (data.deliveryMode !== mode) applyUpdate({deliveryMode: mode});
                }}
              />
            ))}
          </div>

          {data.deliveryMode === 'SELECTIVE' ? (
            <div className="rounded-xl border bg-background/70 p-3">
              <div className="text-sm font-medium text-foreground">{labels.threshold.title}</div>
              <div className="text-xs text-muted-foreground">{labels.threshold.description}</div>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  className="w-32"
                />
                <Button size="sm" onClick={saveThreshold} disabled={update.isPending}>
                  {labels.threshold.save}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            {labels.delivery.manualNote}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OptionTile({
  active,
  title,
  description,
  disabled,
  onClick
}: {
  active: boolean;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-0 rounded-xl border p-3 text-left transition-colors',
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'border-border bg-background hover:border-primary/40',
        disabled && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {active ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

const automationLabels: Record<
  Locale,
  {
    saving: string;
    saved: string;
    error: string;
    thresholdInvalid: string;
    sync: {
      title: string;
      description: string;
      modes: Record<SyncMode, {title: string; description: string}>;
    };
    delivery: {
      title: string;
      description: string;
      manualNote: string;
      modes: Record<DeliveryMode, {title: string; description: string}>;
    };
    threshold: {title: string; description: string; save: string};
  }
> = {
  pt: {
    saving: 'Salvando...',
    saved: 'Configuracao atualizada',
    error: 'Falha ao salvar',
    thresholdInvalid: 'O limiar deve ser um numero entre 0 e 1',
    sync: {
      title: 'Sincronizacao de e-mails',
      description: 'Como os e-mails sao trazidos para a inbox.',
      modes: {
        MANUAL: {title: 'Manual', description: 'Sincroniza apenas quando voce clica em "Sync mailbox".'},
        AUTOMATIC: {title: 'Automatica', description: 'Sincroniza sozinha periodicamente, mantendo a inbox sempre atualizada.'}
      }
    },
    delivery: {
      title: 'Entrega dos pedidos (Creative Gears)',
      description: 'Quando o XML pode ser enviado automaticamente apos a validacao.',
      manualNote: 'O modo Manual esta sempre disponivel. O botao "Send XML" continua funcionando em qualquer modo.',
      modes: {
        MANUAL: {title: 'Manual', description: 'Nada e enviado sozinho. Cada pedido e revisado e aprovado por um colaborador antes da entrega.'},
        SELECTIVE: {title: 'Autonomo seletivo', description: 'Pedidos com confianca da IA acima do limiar seguem sozinhos; os demais entram na fila de revisao.'},
        AUTONOMOUS: {title: 'Totalmente autonomo', description: 'Pedidos completos sao entregues automaticamente. Apenas excecoes vao para o colaborador.'}
      }
    },
    threshold: {
      title: 'Limiar de confianca',
      description: 'Confianca minima (0 a 1) para entrega automatica no modo seletivo.',
      save: 'Salvar limiar'
    }
  },
  en: {
    saving: 'Saving...',
    saved: 'Settings updated',
    error: 'Failed to save',
    thresholdInvalid: 'The threshold must be a number between 0 and 1',
    sync: {
      title: 'Email sync',
      description: 'How emails are pulled into the inbox.',
      modes: {
        MANUAL: {title: 'Manual', description: 'Syncs only when you click "Sync mailbox".'},
        AUTOMATIC: {title: 'Automatic', description: 'Syncs periodically on its own, keeping the inbox up to date.'}
      }
    },
    delivery: {
      title: 'Order delivery (Creative Gears)',
      description: 'When the XML may be sent automatically after validation.',
      manualNote: 'Manual mode is always available. The "Send XML" button keeps working in any mode.',
      modes: {
        MANUAL: {title: 'Manual', description: 'Nothing is sent on its own. Every order is reviewed and approved by a collaborator before delivery.'},
        SELECTIVE: {title: 'Selective autonomous', description: 'Orders with AI confidence above the threshold proceed automatically; the rest go to the review queue.'},
        AUTONOMOUS: {title: 'Fully autonomous', description: 'Complete orders are delivered automatically. Only exceptions are shown to the collaborator.'}
      }
    },
    threshold: {
      title: 'Confidence threshold',
      description: 'Minimum confidence (0 to 1) for automatic delivery in selective mode.',
      save: 'Save threshold'
    }
  },
  nl: {
    saving: 'Opslaan...',
    saved: 'Instellingen bijgewerkt',
    error: 'Opslaan mislukt',
    thresholdInvalid: 'De drempel moet een getal tussen 0 en 1 zijn',
    sync: {
      title: 'E-mailsynchronisatie',
      description: 'Hoe e-mails in de inbox worden opgehaald.',
      modes: {
        MANUAL: {title: 'Handmatig', description: 'Synchroniseert alleen als je op "Sync mailbox" klikt.'},
        AUTOMATIC: {title: 'Automatisch', description: 'Synchroniseert periodiek vanzelf en houdt de inbox actueel.'}
      }
    },
    delivery: {
      title: 'Orderlevering (Creative Gears)',
      description: 'Wanneer de XML automatisch verzonden mag worden na validatie.',
      manualNote: 'Handmatige modus is altijd beschikbaar. De knop "Send XML" blijft in elke modus werken.',
      modes: {
        MANUAL: {title: 'Handmatig', description: 'Er wordt niets vanzelf verzonden. Elke order wordt door een medewerker beoordeeld en goedgekeurd voor levering.'},
        SELECTIVE: {title: 'Selectief autonoom', description: 'Orders met AI-betrouwbaarheid boven de drempel gaan vanzelf door; de rest gaat naar de reviewwachtrij.'},
        AUTONOMOUS: {title: 'Volledig autonoom', description: 'Volledige orders worden automatisch geleverd. Alleen uitzonderingen worden aan de medewerker getoond.'}
      }
    },
    threshold: {
      title: 'Betrouwbaarheidsdrempel',
      description: 'Minimale betrouwbaarheid (0 tot 1) voor automatische levering in selectieve modus.',
      save: 'Drempel opslaan'
    }
  }
};
