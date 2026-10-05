/**
 * Build/version info injected at build time via next.config `env`
 * (Renato 2026-10-05). Lets the portal show which build is live.
 */
export const BUILD_INFO = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
  sha: process.env.NEXT_PUBLIC_BUILD_SHA || 'dev',
  time: process.env.NEXT_PUBLIC_BUILD_TIME || ''
};

/** Short one-liner, e.g. "v0.1.0 · a1b2c3d". */
export function buildLabel(): string {
  return `v${BUILD_INFO.version} · ${BUILD_INFO.sha}`;
}

/** Localized build date (or empty when unknown). */
export function buildDate(locale: string): string {
  if (!BUILD_INFO.time) return '';
  const d = new Date(BUILD_INFO.time);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
}
