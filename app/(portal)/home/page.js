'use client';

import { useState } from 'react';
import HeroPunchCard from '@/components/home/HeroPunchCard';
import MonthBar from '@/components/home/MonthBar';
import StatsRow from '@/components/home/StatsRow';
import QuickActions from '@/components/home/QuickActions';
import RecentAttendance from '@/components/home/RecentAttendance';
import UpcomingHolidays from '@/components/home/UpcomingHolidays';
import LeaveApplyModal from '@/components/leave/LeaveApplyModal';
import RequestCorrectionModal from '@/components/attendance/RequestCorrectionModal';

export default function HomePage() {
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  return (
    <>
      <HeroPunchCard />
      <MonthBar />
      <StatsRow />
      <QuickActions onApplyLeave={() => setLeaveModalOpen(true)} onRequestCorrection={() => setCorrectionModalOpen(true)} />
      <RecentAttendance />
      <UpcomingHolidays />
      <LeaveApplyModal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} />
      <RequestCorrectionModal open={correctionModalOpen} onClose={() => setCorrectionModalOpen(false)} />
    </>
  );
}
