'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { makeStore } from '@/lib/store';
import AuthHydrator from './AuthHydrator';
import ToastHost from './ui/ToastHost';

export default function Providers({ children }) {
  const [store] = useState(makeStore);

  // Enables the refetchOnFocus / refetchOnReconnect set on apiSlice.
  useEffect(() => setupListeners(store.dispatch), [store]);

  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
      <ToastHost />
    </Provider>
  );
}
