'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {useRouter} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {useAuth} from '@/hooks/use-auth';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const {login, status} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard', {locale});
    }
  }, [status, router, locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/dashboard', {locale});
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground">
            {t('auth.brand')}
          </div>
          <CardTitle className="text-xl">{t('auth.title')}</CardTitle>
          <div className="text-sm text-muted-foreground">{t('auth.subtitle')}</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('auth.email')}</div>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t('auth.password')}</div>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || status === 'loading'}
            >
              {submitting ? t('common.loading') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
