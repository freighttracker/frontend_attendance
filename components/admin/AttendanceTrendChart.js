'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const SERIES = [
  { key: 'present', label: 'Present', color: '#2cb825' },
  { key: 'halfDay', label: 'Half day', color: '#d97706' },
  { key: 'onLeave', label: 'On leave', color: '#2563eb' },
];

const LABELS = Object.fromEntries(SERIES.map((s) => [s.key, s.label]));

export default function AttendanceTrendChart({ data }) {
  
  if (!data || !data.some((d) => d.present || d.halfDay || d.onLeave)) {
    return <div className="chart-empty">No attendance recorded in the last 7 days</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(value, name) => [value, LABELS[name] || name]}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          cursor={{ fill: '#f2f2f2' }}
        />
        <Legend formatter={(name) => LABELS[name] || name} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        {SERIES.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="day"
            fill={s.color}
            maxBarSize={36}
            radius={i === SERIES.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
