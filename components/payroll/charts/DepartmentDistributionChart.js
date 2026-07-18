'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { fmtCurrency } from '@/lib/utils/format';

const COLORS = ['#2cb825', '#10b981', '#2563eb', '#d97706', '#ef4444', '#7c3aed', '#0ea5e9'];

export default function DepartmentDistributionChart({ data }) {
  if (!data || !data.length) {
    return <div className="chart-empty">No department data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={44} />
        <Tooltip
          formatter={(value) => [fmtCurrency(value), 'Salary']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          cursor={{ fill: '#f2f2f2' }}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={entry.department || i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
