'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials, setHydrated } from '@/lib/features/authSlice';

export default function AuthHydrator() {
  
  const dispatch = useAppDispatch();
  useEffect(() => {
    try {
      const token = localStorage.getItem('attendance_token');
      const refreshToken = localStorage.getItem('attendance_refresh_token');
      const rawUser = localStorage.getItem('attendance_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (token && user) {
        dispatch(setCredentials({ user, token, refreshToken }));
      }
    } catch {
      // corrupted storage, ignore and start unauthenticated
    } finally {
      dispatch(setHydrated());
    }
  }, [dispatch]);

  return null;
}
