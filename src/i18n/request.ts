import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

const messagesLoaders = {
  nl: () => import('../../messages/nl.json').then((m) => m.default),
  en: () => import('../../messages/en.json').then((m) => m.default),
  pt: () => import('../../messages/pt.json').then((m) => m.default)
} as const;

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale =
    requested && requested in messagesLoaders
      ? (requested as keyof typeof messagesLoaders)
      : routing.defaultLocale;

  return {
    locale,
    messages: await messagesLoaders[locale]()
  };
});
