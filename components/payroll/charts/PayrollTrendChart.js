'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtCurrency } from '@/lib/utils/format';

export default function PayrollTrendChart({ data }) {
  if (!data || !data.length) {
    return <div className="chart-empty">No payroll trend data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2cb825" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2cb825" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#111111" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e5e5e5" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={44} />
        <Tooltip
          formatter={(value, name) => [fmtCurrency(value), name === 'gross' ? 'Gross' : 'Net']}
          contentStyle={{ borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
        />
        <Area type="monotone" dataKey="gross" stroke="#2cb825" strokeWidth={2} fill="url(#grossGrad)" />
        <Area type="monotone" dataKey="net" stroke="#111111" strokeWidth={2} fill="url(#netGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
