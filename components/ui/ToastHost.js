'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectToast, clearToast } from '@/lib/features/uiSlice';

export default function ToastHost() {
  const toast = useAppSelector(selectToast);
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const raf = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), 2700);
    const clearTimer = setTimeout(() => dispatch(clearToast()), 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [toast, dispatch]);

  return (
    <div className={`toast ${visible ? 'on' : ''} ${toast?.type === 'err' ? 'err' : ''}`}>
      {toast?.message || ''}
    </div>
  );
}
