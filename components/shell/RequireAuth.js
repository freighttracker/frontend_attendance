'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAdmin, selectIsAuthenticated, selectIsHydrated } from '@/lib/features/authSlice';
import Spinner from '../ui/Spinner';

export default function RequireAuth({ children }) {
  const isHydrated = useAppSelector(selectIsHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAdmin && !pathname.startsWith('/admin') && !pathname.startsWith('/payroll') && pathname !== '/notifications') {
      router.replace('/admin');
      return;
    }
    if (!isAdmin && (pathname.startsWith('/admin') || pathname.startsWith('/payroll'))) {
      router.replace('/home');
    }
  }, [isHydrated, isAuthenticated, isAdmin, pathname, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="view">
        <Spinner />
      </div>
    );
  }

  return children;
}
