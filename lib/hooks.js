'use client';

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from './features/uiSlice';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export function useToast() {
  const dispatch = useDispatch();
  return useCallback(
    (message, type = 'ok') => dispatch(showToast({ message, type })),
    [dispatch]
  );
}

export function extractErrorMessage(error, fallback = 'Something went wrong') {
  if (typeof error?.data === 'object' && error.data?.message) return error.data.message;
  if (typeof error?.data === 'string' && error.data.trim()) return error.data;
  if (error?.status !== 'PARSING_ERROR' && error?.error) return error.error;
  return fallback;
}
