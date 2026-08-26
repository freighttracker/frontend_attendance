'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectIsAdmin, selectCurrentUser } from '@/lib/features/authSlice';
import { HomeIcon, ClockIcon, CheckSquareIcon, UserIcon, ShieldIcon, MoneyIcon } from '../icons';

const EMPLOYEE_ITEMS = [
  { href: '/home', label: 'Home', Icon: HomeIcon },
  { href: '/history', label: 'History', Icon: ClockIcon },
  { href: '/leave', label: 'Leave', Icon: CheckSquareIcon },
  { href: '/profile', label: 'Profile', Icon: UserIcon },
];

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Admin', Icon: ShieldIcon },
  { href: '/payroll', label: 'Payroll', Icon: MoneyIcon },
];

export default function BottomNav() {
  const isAdmin = useAppSelector(selectIsAdmin);
  const user = useAppSelector(selectCurrentUser);
  const pathname = usePathname();

  // A platform Super Admin only ever manages companies - no personal
  // attendance/leave/payroll pages apply to them, so there's nothing to
  // navigate to and the bar is just noise.
  if (user?.role === 'superadmin') return null;

  const items = isAdmin ? ADMIN_ITEMS : EMPLOYEE_ITEMS;

  return (
    <nav className="bnav">
      {items.map(({ href, label, Icon }) => {

        const active = pathname === href || pathname?.startsWith(href + '/');
        
        return (
          <Link key={href} href={href} className={`ni ${active ? 'on' : ''}`}>
            <Icon />
            <span>{label}</span>
            <div className="ni-pip" />
          </Link>
        );
      })}
    </nav>
  );
}
