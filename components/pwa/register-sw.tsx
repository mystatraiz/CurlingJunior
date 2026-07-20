'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (PWA installable + cache hors ligne léger). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // L'app fonctionne sans service worker (navigation privée, etc.)
    });
  }, []);
  return null;
}
