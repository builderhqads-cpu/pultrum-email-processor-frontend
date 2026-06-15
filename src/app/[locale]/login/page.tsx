'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {toast} from 'sonner';

import {useRouter} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {useAuth} from '@/hooks/use-auth';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {BrandMark} from '@/components/ui/BrandMark';

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

  const wordmark = (
    <div className="flex items-center gap-2">
      <BrandMark className="h-7 w-7" />
      <span className="text-xl font-bold tracking-tight">{t('app.name')}</span>
    </div>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding panel */}
      <div className="hidden items-center justify-center bg-muted/40 px-12 lg:flex">
        <div className="flex max-w-md flex-col gap-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" />
            <span className="text-4xl font-bold tracking-tight">{t('app.name')}</span>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('auth.tagline')}
          </p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              {wordmark}
              <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                {t('auth.brand')}
              </div>
            </div>

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
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t('auth.password')}</div>
                  <button
                    type="button"
                    onClick={() => toast.info(t('auth.forgotPasswordHint'))}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  type="password"
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <div className="text-sm text-destructive">{error}</div>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('common.loading') : t('auth.signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
