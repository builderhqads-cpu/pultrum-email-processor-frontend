'use client';

import {Languages} from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';

import {routing, type Locale} from '@/i18n/routing';
import {useRouter} from '@/i18n/navigation';
import {buttonVariants} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

export function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname() || '/';

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;

    const segments = pathname.split('/').filter(Boolean);
    const locales = routing.locales as readonly string[];

    if (segments.length > 0 && locales.includes(segments[0])) {
      // Strip current locale so next-intl can prefix correctly
      segments.shift();
    } else {
      // No locale prefix present; keep as-is
    }

    const basePath = `/${segments.join('/')}` || '/';
    const qs = typeof window !== 'undefined' ? window.location.search : '';

    router.replace(qs ? `${basePath}${qs}` : basePath, {locale: nextLocale});
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({variant: 'outline', size: 'sm'}), 'gap-2')}>
        <Languages className="h-4 w-4" />
        <span className="font-mono text-xs">{t(`languages.${locale}`)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('topbar.language')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {routing.locales.map((nextLocale) => (
            <DropdownMenuItem
              key={nextLocale}
              onClick={() => changeLocale(nextLocale)}
            >
              {t(`languages.${nextLocale}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
