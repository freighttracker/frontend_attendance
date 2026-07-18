'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector, useToast } from '@/lib/hooks';
import { logout, selectCurrentUser, selectIsAdmin } from '@/lib/features/authSlice';
import { useGetUnreadCountQuery } from '@/lib/services/notificationsApi';
import { apiSlice } from '@/lib/services/apiSlice';
import { BellIcon, LogOutIcon } from '../icons';
import { initials } from '@/lib/utils/format';

export default function Topbar() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const { data: unread } = useGetUnreadCountQuery(undefined, { skip: !user, pollingInterval: 60000 });
  const unreadCount = unread?.count ?? unread?.unreadCount ?? 0;

  function handleLogout() {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    localStorage.removeItem('attendance_token');
    localStorage.removeItem('attendance_refresh_token');
    localStorage.removeItem('attendance_user');
    toast('Signed out');
    router.replace('/login');
  }

  return (
    <header className="top">
      <div className="logo">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
          </svg>
        </div>
        <span className="logo-name">
          Attendance<span>HR</span>
        </span>
      </div>
      <div className="top-r">
        {isAdmin ? <span className="rbadge">Admin</span> : null}
        <Link href="/notifications" className="bell" aria-label="Notifications">
          <BellIcon />
          {unreadCount > 0 ? <span className="bell-dot" /> : null}
        </Link>
        <button className="av" onClick={handleLogout} title="Sign out" aria-label="Sign out">
          {user ? initials(`${user.firstName || user.name || ''}`) : <LogOutIcon style={{ width: 14, height: 14 }} />}
        </button>
      </div>
    </header>
  );
}
