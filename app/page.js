'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAdmin, selectIsAuthenticated, selectIsHydrated } from '@/lib/features/authSlice';
import Spinner from '@/components/ui/Spinner';

export default function RootPage() {
  const isHydrated = useAppSelector(selectIsHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (isAdmin) {
      router.replace('/admin');
    } else {
      router.replace('/home');
    }
  }, [isHydrated, isAuthenticated, isAdmin, router]);

  return (
    <div className="view">
      <Spinner />
    </div>
  );
}
