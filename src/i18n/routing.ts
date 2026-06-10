import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['nl', 'en', 'pt'] as const,
  defaultLocale: 'nl'
});

export type Locale = (typeof routing.locales)[number];

export function isValidLocale(value: string): value is Locale {
  // `defineRouting` doesn't currently narrow `includes` to the literal union
  // so we keep a small runtime helper for route param validation.
  return (routing.locales as readonly string[]).includes(value);
}
