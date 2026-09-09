'use client';

import {useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {useTranslations} from 'next-intl';

import {Button} from '@/components/ui/button';

/**
 * Light/dark toggle. The initial theme class is set before paint by the inline
 * script in the root layout; this only flips it and persists the choice. Shows a
 * moon in light mode (click -> dark) and a sun in dark mode (click -> light).
 */
export function ThemeToggle() {
  const t = useTranslations('topbar');
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mounted pattern: sync the icon to the real theme only on the client, so
    // SSR and first render match (no hydration flash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      title={t('toggleTheme')}
    >
      {mounted && dark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
