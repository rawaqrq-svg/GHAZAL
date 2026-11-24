'use client';

import { useEffect, useTransition, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AdminAutoRefresher() {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const performSilentRefresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (document.visibilityState !== 'visible') return;

    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Set up 60-second periodic background update interval
  useEffect(() => {
    // Skip auto-refresh on admin login page
    if (pathname === '/admin/login') return;

    const intervalId = setInterval(() => {
      performSilentRefresh();
    }, 60000); // exactly 1 minute (60,000 ms)

    // Also refresh when tab becomes visible again if window was minimized
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSilentRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, performSilentRefresh]);

  // Keep auto-refresh fully functional in the background while keeping the UI element hidden
  return null;
}
