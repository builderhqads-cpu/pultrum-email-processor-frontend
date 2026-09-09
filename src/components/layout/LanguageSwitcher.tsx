'use client';

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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {FlagIcon} from '@/components/layout/flag-icon';
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
      <DropdownMenuTrigger
        className={cn(buttonVariants({variant: 'outline', size: 'icon-sm'}))}
        aria-label={t(`languages.${locale}`)}
      >
        <FlagIcon code={locale} className="h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          {routing.locales.map((nextLocale) => (
            <DropdownMenuItem
              key={nextLocale}
              onClick={() => changeLocale(nextLocale)}
              className="gap-2"
            >
              <FlagIcon code={nextLocale} />
              {t(`languages.${nextLocale}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
