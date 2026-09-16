'use client';

import {useEffect, useLayoutEffect} from 'react';
import {usePathname} from 'next/navigation';

// useLayoutEffect on the client (applies before paint → no flash), useEffect on
// the server (avoids the SSR warning).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function applyStoredTheme() {
  try {
    const stored = localStorage.getItem('theme');
    const dark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch {
    // ignore storage/matchMedia failures (private mode etc.)
  }
}

/**
 * Keeps the `.dark` theme class on <html> in sync after client navigations.
 *
 * The pre-paint init script only runs on a full page load. A language switch is a
 * client navigation that re-renders the root layout and can drop the
 * imperatively-set `.dark` class WITHOUT re-running that script — so dark mode
 * silently reverted to light. Re-asserting the stored theme on every pathname
 * change (the locale prefix is part of the pathname) fixes that, before paint.
 */
export function ThemeManager() {
  const pathname = usePathname();
  useIsomorphicLayoutEffect(() => {
    applyStoredTheme();
  }, [pathname]);
  return null;
}
