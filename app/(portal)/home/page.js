'use client';

import { useState } from 'react';
import HeroPunchCard from '@/components/home/HeroPunchCard';
import MonthBar from '@/components/home/MonthBar';
import StatsRow from '@/components/home/StatsRow';
import QuickActions from '@/components/home/QuickActions';
import RecentAttendance from '@/components/home/RecentAttendance';
import UpcomingHolidays from '@/components/home/UpcomingHolidays';
import LeaveApplyModal from '@/components/leave/LeaveApplyModal';

export default function HomePage() {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  return (
    <>
      <HeroPunchCard />
      <MonthBar />
      <StatsRow />
      <QuickActions onApplyLeave={() => setLeaveModalOpen(true)} />
      <RecentAttendance />
      <UpcomingHolidays />
      <LeaveApplyModal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} />
    </>
  );
}
