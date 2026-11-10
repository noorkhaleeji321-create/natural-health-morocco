/**
 * Ultra-safe LocalStorage and SessionStorage wrapper with in-memory fallback.
 * Prevents iframe DOMException / SecurityError, storage quotas, and private browsing crashes.
 */

const memoryStore = new Map<string, string>();

function isStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = isStorageAvailable();

function sanitizeValue<T>(val: T): T {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    if (val.startsWith('data:image/') && val.length > 50000) {
      return '/assets/images/hero_dates_honey_1793739602965.webp' as unknown as T;
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item)) as unknown as T;
  }

  if (typeof val === 'object') {
    const objCopy: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      objCopy[k] = sanitizeValue(v);
    }
    return objCopy as T;
  }

  return val;
}

export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    const sanitized = sanitizeValue(value);
    const stringified = JSON.stringify(sanitized);

    memoryStore.set(key, stringified);

    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, stringified);
        return true;
      } catch {
        // Quota or SecurityError: keep in memoryStore
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function safeGetItem<T>(key: string, fallbackValue: T): T {
  try {
    if (hasLocalStorage) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          return JSON.parse(item) as T;
        }
      } catch {
        // SecurityError in iframe: fallback to memoryStore
      }
    }

    if (memoryStore.has(key)) {
      const memItem = memoryStore.get(key);
      if (memItem) {
        return JSON.parse(memItem) as T;
      }
    }

    return fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    memoryStore.delete(key);
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
