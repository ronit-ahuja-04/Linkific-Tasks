import { useMemo } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { toastAdded } from './toastSlice';

export function useToast() {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      success: (message: string) => dispatch(toastAdded('success', message)),
      error: (message: string) => dispatch(toastAdded('error', message)),
      info: (message: string) => dispatch(toastAdded('info', message)),
    }),
    [dispatch],
  );
}
