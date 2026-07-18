'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtCurrency } from '@/lib/utils/format';

export default function AttendanceVsPayrollChart({ data }) {
  if (!data || !data.length) {
    return <div className="chart-empty">No attendance/payroll data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={44} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={36} />
        <Tooltip
          formatter={(value, name) => (name === 'attendancePct' ? [`${value}%`, 'Attendance'] : [fmtCurrency(value), 'Payroll'])}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          cursor={{ fill: '#f2f2f2' }}
        />
        <Bar yAxisId="left" dataKey="payroll" fill="#e5e5e5" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Line yAxisId="right" type="monotone" dataKey="attendancePct" stroke="#2cb825" strokeWidth={2} dot={{ r: 3, fill: '#2cb825' }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
