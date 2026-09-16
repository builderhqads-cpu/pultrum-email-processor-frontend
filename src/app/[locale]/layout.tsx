import {notFound} from 'next/navigation';
import {Geist, Geist_Mono} from 'next/font/google';
import Script from 'next/script';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';

import {routing} from '@/i18n/routing';
import {isValidLocale} from '@/i18n/routing';
import {QueryProvider} from '@/components/providers/query-provider';
import {AuthProvider} from '@/components/providers/auth-provider';
import {AppLayout} from '@/components/layout/AppLayout';
import {ThemeManager} from '@/components/layout/ThemeManager';
import {Toaster} from '@/components/ui/sonner';

import '../globals.css';

// Set the theme class before paint to avoid a flash of the wrong theme. Uses
// next/script beforeInteractive so it is injected into the initial HTML and runs
// before hydration (a raw <script> in the JSX tree is NOT executed on client
// navigation and triggers a React warning). ThemeManager re-asserts it after
// client navigations (e.g. a language switch).
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark', d);}catch(e){}})();`;

const fontSans = Geist({subsets: ['latin'], variable: '--font-sans'});
const fontMono = Geist_Mono({subsets: ['latin'], variable: '--font-geist-mono'});

export const metadata = {
  title: 'Pultrum | Orderintaker',
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
    <html lang={locale} suppressHydrationWarning>
      {/* Font variables live on <body>, NOT <html>: the theme is the `.dark`
          class set imperatively on <html>, and if React owned <html>'s
          className it would wipe `.dark` when the [locale] layout re-renders on
          a language switch (client nav, so the anti-flash script never re-runs)
          — reverting dark mode to light. Keeping <html> free of a
          React-managed className lets `.dark` survive locale changes. */}
      <body className={`${fontSans.variable} ${fontMono.variable} min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeManager />
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
