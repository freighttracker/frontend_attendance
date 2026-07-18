'use client';

import { createPortal } from 'react-dom';

export default function PrintPortal({ children }) {
  if (typeof document === 'undefined') return null;
  const node = document.getElementById('parea');
  if (!node) return null;
  return createPortal(children, node);
}
