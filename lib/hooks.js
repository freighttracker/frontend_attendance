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
  return error?.data?.message || error?.error || fallback;
}
