'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '@/lib/storage/localStorage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const value = getStorageItem(key, initialValue);
    setStoredValue(value);
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prevValue) => {
      const valueToStore = value instanceof Function ? value(prevValue) : value;
      setStorageItem(key, valueToStore);
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue, isLoaded] as const;
}
