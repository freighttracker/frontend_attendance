'use client';

import { useEffect, useRef, useState } from 'react';

export default function AdminTabs({ tabs, active, onChange, pendingCount }) {
  
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  
  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [tabs.length]);

  // If the active tab changes (or a new one is added) and it's scrolled out
  // of view, bring it into view rather than leaving it silently unreachable.
  useEffect(() => {
    const activeBtn = scrollRef.current?.querySelector(`[data-tab="${active}"]`);
    activeBtn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  function scrollByAmount(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <div className="atabs-wrap">
      <div className="atabs" ref={scrollRef}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            data-tab={tab.key}
            className={`atab ${active === tab.key ? 'on' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.key === 'leave' && pendingCount > 0 ? <span className="pdot2">{pendingCount}</span> : null}
          </button>
        ))}
      </div>
      {canScrollLeft ? (
        <button type="button" className="atabs-fade left" aria-label="Scroll tabs left" onClick={() => scrollByAmount(-120)}>
          ‹
        </button>
      ) : null}
      {canScrollRight ? (
        <button type="button" className="atabs-fade right" aria-label="Scroll tabs right" onClick={() => scrollByAmount(120)}>
          ›
        </button>
      ) : null}
    </div>
  );
}
