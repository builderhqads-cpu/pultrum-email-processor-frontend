'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';

type PageTitleContextValue = {
  title: string;
  setTitle: (title: string) => void;
};

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

/**
 * Holds the current page title so the topbar can render it. Each page publishes
 * its title through <PageHeader>, which calls setTitle (Renato 2026-09-09:
 * "move the page title into the header").
 */
export function PageTitleProvider({children}: {children: React.ReactNode}) {
  const [title, setTitle] = useState('');

  // Reflect the current page in the browser tab: "<Page> | Pultrum".
  useEffect(() => {
    document.title = title ? `${title} | Pultrum` : 'Pultrum';
  }, [title]);

  const value = useMemo(() => ({title, setTitle}), [title]);
  return (
    <PageTitleContext.Provider value={value}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
