/**
 * In-app changelog (Renato 2026-10-05). Each release is one entry, newest first.
 * The "What's New" dialog shows the latest unseen entry automatically and can be
 * reopened from the version stamp in the sidebar.
 *
 * To publish a release note: add a new entry at the TOP with a bumped `version`
 * (any string, just make it different from the previous one) and today's `date`.
 * The dialog then pops once for each user who hasn't seen that version.
 *
 * Each change's `text` is either a plain string (shown as-is in every language)
 * or a {pt, en, nl} object to localize it.
 */

export type ChangeType = 'feature' | 'improvement' | 'fix';

export type LocalizedText = {pt: string; en: string; nl: string};

export type ChangeItem = {
  type: ChangeType;
  text: string | LocalizedText;
};

export type ChangelogEntry = {
  /** Stable id for this release — bump it to trigger the dialog. */
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  changes: ChangeItem[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2026-10-05',
    date: '2026-10-05',
    changes: [
      {
        type: 'feature',
        text: {
          pt: 'Aviso de erro no pedido com botão "Tentar novamente" (reenvia o XML ou reprocessa, conforme a falha).',
          en: 'Error banner on failed orders with a one-click retry (resends the XML or reprocesses, depending on the failure).',
          nl: 'Foutmelding op mislukte opdrachten met één-klik "Opnieuw proberen" (verstuurt de XML opnieuw of herverwerkt, afhankelijk van de fout).'
        }
      },
      {
        type: 'feature',
        text: {
          pt: 'Preencher campos faltantes direto na tela ("Adicionar informação") e editar campos detectados com um botão de limpar.',
          en: 'Fill missing fields right on the page ("Add information") and edit detected fields, with a clear button.',
          nl: 'Ontbrekende velden direct op de pagina invullen ("Informatie toevoegen") en gedetecteerde velden bewerken, met een wisknop.'
        }
      },
      {
        type: 'feature',
        text: {
          pt: 'Controle por cliente de quais tipos de anexo entram no XML; e criar perfil de cliente só pelo nome (e-mail opcional).',
          en: 'Per-customer control of which attachment types go in the XML; and create a customer profile by name only (e-mail optional).',
          nl: 'Per klant instellen welke bijlagetypen in de XML gaan; en een klantprofiel aanmaken met alleen een naam (e-mail optioneel).'
        }
      },
      {
        type: 'improvement',
        text: {
          pt: 'Fila de pedidos reorganizada: avulsos e lotes (Múltiplos) agrupados do mesmo jeito, ordenados por chegada (com opção "Atualizados recentemente").',
          en: 'Reworked order queue: single orders and batches (Multiple) grouped the same way, sorted by arrival (with a "Recently updated" option).',
          nl: 'Vernieuwde opdrachtenlijst: losse opdrachten en batches (Meerdere) op dezelfde manier gegroepeerd, gesorteerd op aankomst (met optie "Recent bijgewerkt").'
        }
      },
      {
        type: 'improvement',
        text: {
          pt: 'Menu lateral retrátil, tema e idioma no menu do usuário, avatar colorido por usuário, versão do sistema visível e esta tela de novidades.',
          en: 'Collapsible sidebar, theme and language in the user menu, per-user colored avatar, visible system version, and this What\'s New screen.',
          nl: 'Inklapbaar zijmenu, thema en taal in het gebruikersmenu, gekleurde avatar per gebruiker, zichtbare systeemversie en dit "Wat is nieuw"-scherm.'
        }
      },
      {
        type: 'improvement',
        text: {
          pt: 'Botões de copiar/baixar (XML, JSON, diagnóstico) e aviso global quando o serviço de IA está instável.',
          en: 'Copy/download buttons (XML, JSON, diagnostic) and a global banner when the AI service is degraded.',
          nl: 'Kopieer-/downloadknoppen (XML, JSON, diagnose) en een globale melding wanneer de AI-dienst verstoord is.'
        }
      },
      {
        type: 'fix',
        text: {
          pt: 'Abrir um pedido não o joga mais para o topo da lista.',
          en: 'Opening an order no longer bumps it to the top of the list.',
          nl: 'Een opdracht openen zet deze niet meer bovenaan de lijst.'
        }
      },
      {
        type: 'fix',
        text: {
          pt: 'Pedidos incompletos / aguardando cliente agora mostram a marcação amarela corretamente (inclusive com o grupo recolhido).',
          en: 'Incomplete / waiting-for-customer orders now show the yellow marker correctly (including when the group is collapsed).',
          nl: 'Onvolledige / op-klant-wachtende opdrachten tonen nu de gele markering correct (ook wanneer de groep ingeklapt is).'
        }
      }
    ]
  }
];

export const LATEST_VERSION = CHANGELOG[0]?.version ?? '';

/** Pick the right language for a change's text (falls back to the raw string). */
export function localizedChange(text: string | LocalizedText, locale: string): string {
  if (typeof text === 'string') return text;
  if (locale === 'pt' || locale === 'en' || locale === 'nl') return text[locale];
  return text.en;
}
