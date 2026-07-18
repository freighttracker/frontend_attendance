'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtCurrency } from '@/lib/utils/format';

export default function SalaryExpenseChart({ data }) {
  if (!data || !data.length) {
    return <div className="chart-empty">No expense data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={44} />
        <Tooltip
          formatter={(value, name) => [fmtCurrency(value), name === 'earnings' ? 'Earnings' : 'Deductions']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          cursor={{ fill: '#f2f2f2' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="earnings" name="Earnings" stackId="a" fill="#2cb825" radius={[0, 0, 0, 0]} maxBarSize={36} />
        <Bar dataKey="deductions" name="Deductions" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
