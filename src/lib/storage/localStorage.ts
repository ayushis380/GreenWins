const STORAGE_PREFIX = 'greenwins_';

export const STORAGE_KEYS = {
  USER: `${STORAGE_PREFIX}user`,
  ACTIONS: `${STORAGE_PREFIX}actions`,
  WIN_CARDS: `${STORAGE_PREFIX}wincards`,
  CHAT: `${STORAGE_PREFIX}chat`,
  IMPACT: `${STORAGE_PREFIX}impact`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  VERSION: `${STORAGE_PREFIX}version`,
} as const;

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

export function clearAllStorage(): void {
  if (typeof window === 'undefined') return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
