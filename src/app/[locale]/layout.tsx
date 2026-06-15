import {notFound} from 'next/navigation';
import {Geist, Geist_Mono} from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';

import {routing} from '@/i18n/routing';
import {isValidLocale} from '@/i18n/routing';
import {QueryProvider} from '@/components/providers/query-provider';
import {AuthProvider} from '@/components/providers/auth-provider';
import {AppLayout} from '@/components/layout/AppLayout';
import {Toaster} from '@/components/ui/sonner';

import '../globals.css';

const fontSans = Geist({subsets: ['latin'], variable: '--font-sans'});
const fontMono = Geist_Mono({subsets: ['latin'], variable: '--font-geist-mono'});

export const metadata = {
  title: 'Pultrum AI',
  description: 'Automated logistics email processing, built with AI.'
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout(props: LayoutProps<'/[locale]'>) {
  const {locale} = await props.params;

  if (!isValidLocale(locale)) notFound();

  // Enables static rendering by avoiding request header lookups in next-intl.
  setRequestLocale(locale);

  const messages = await getMessages({locale});

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <AppLayout locale={locale}>{props.children}</AppLayout>
              <Toaster richColors closeButton />
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
