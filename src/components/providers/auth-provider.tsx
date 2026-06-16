'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';

import type {AuthUser} from '@/lib/api/auth-api';
import * as authApi from '@/lib/api/auth-api';
import {clearAccessToken, getAccessToken, setAccessToken} from '@/lib/auth/token-storage';
import {AuthContext, type AuthContextValue, type AuthStatus} from '@/hooks/use-auth';

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setStatus('unauthenticated');
      setError(null);
      return;
    }

    try {
      const me = await authApi.me();
      setUser(me);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
      setError(err instanceof Error ? err.message : null);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    setError(null);
    const res = await authApi.login({email, password});
    setAccessToken(res.accessToken);
    await refreshMe();
    // refreshMe sets user/status; return latest known user (fallback to login response)
    return res.user;
  }, [refreshMe]);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      code: string;
    }) => {
      // Create the account only — do NOT start a session. The user is sent to
      // the login page to sign in afterwards.
      const res = await authApi.register(payload);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setError(null);
    setStatus('unauthenticated');
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      user,
      error,
      login,
      register,
      logout,
      refreshMe
    }),
    [status, user, error, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
