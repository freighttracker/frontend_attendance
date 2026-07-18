'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtCurrency } from '@/lib/utils/format';

const COLORS = ['#2cb825', '#10b981', '#2563eb', '#d97706', '#ef4444', '#7c3aed'];

export default function BonusDistributionChart({ data }) {
  if (!data || !data.length) {
    return <div className="chart-empty">No bonus data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="type" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((entry, i) => (
            <Cell key={entry.type || i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [fmtCurrency(value), name]}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
