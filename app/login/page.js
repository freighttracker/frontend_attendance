'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setCredentials, selectIsAuthenticated, selectIsAdmin, selectIsHydrated } from '@/lib/features/authSlice';
import { useLoginMutation } from '@/lib/services/authApi';
import { useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isHydrated = useAppSelector(selectIsHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(isAdmin ? '/admin' : '/home');
    }
  }, [isHydrated, isAuthenticated, isAdmin, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Fill in all fields.');
      return;
    }
    try {
      const data = await login({ email: email.trim().toLowerCase(), password }).unwrap();
      dispatch(setCredentials({ user: data.user, token: data.token, refreshToken: data.refreshToken }));
      localStorage.setItem('attendance_token', data.token);
      localStorage.setItem('attendance_user', JSON.stringify(data.user));
      if (data.refreshToken) localStorage.setItem('attendance_refresh_token', data.refreshToken);
      const adminTierRoles = ['superadmin', 'admin', 'company_admin', 'subcompany_admin'];
      router.replace(adminTierRoles.includes(data.user?.role) ? '/admin' : '/home');
    } catch (err) {
      setError(err?.data?.message || 'Invalid email or password.');
    }
  }

  return (
    <div className="login">
      <div className="ll">
        <svg viewBox="0 0 24 24">
          <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
        </svg>
      </div>
      <div className="lt">FreighTrackHR</div>
      <div className="ls">Attendance &amp; HR System</div>
      <form className="lform" onSubmit={handleSubmit}>
        <div className="ff">
          <label className="fl">Email</label>
          <input
            className="fi"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="ff">
          <label className="fl">Password</label>
          <input
            className="fi"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="ferr">{error}</div>
        <button className="btn btn-p btn-full" type="submit" disabled={isLoading} style={{ marginTop: 4 }}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
