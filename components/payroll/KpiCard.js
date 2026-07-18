'use client';

import { useEffect, useRef, useState } from 'react';

function useCountUp(target) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const from = 0;
    const to = Number(target) || 0;
    const duration = 600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return value;
}

export default function KpiCard({ icon: Icon, tone = 'ind', label, value, format, trend }) {
  const animated = useCountUp(value);

  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className={`kpi-icon ${tone}`}>
          <Icon />
        </div>
        {trend ? <span className={`kpi-trend ${trend.direction}`}>{trend.direction === 'up' ? '▲' : '▼'} {trend.label}</span> : null}
      </div>
      <div className="kpi-v">{format ? format(animated) : animated.toLocaleString('en-IN')}</div>
      <div className="kpi-l">{label}</div>
    </div>
  );
}
