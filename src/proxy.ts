import type {NextRequest} from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Exclude API routes, Next internals, and files with an extension (e.g. favicon.ico).
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)']
};
