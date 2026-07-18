import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import uiReducer from './features/uiSlice';
import { apiSlice } from './services/apiSlice';

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}
