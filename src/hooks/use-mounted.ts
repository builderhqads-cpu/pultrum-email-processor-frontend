'use client';

import {useSyncExternalStore} from 'react';

function subscribe(onStoreChange: () => void) {
  // Trigger a re-render right after hydration/commit.
  queueMicrotask(onStoreChange);
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

