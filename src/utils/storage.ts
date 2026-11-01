/**
 * Safe LocalStorage wrapper to prevent uncaught QuotaExceededError and quota crashes.
 */

// Helper to recursively strip huge base64 data URLs to avoid blowing up localStorage quota
function sanitizeValue<T>(val: T): T {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    if (val.startsWith('data:image/') && val.length > 50000) {
      return '/assets/aistudio/aad8b4fe-64a3-4e47-89bd-93b688d4e9a1__1_daght_16fef5de.jpg' as unknown as T;
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
    const stringified = JSON.stringify(value);
    localStorage.setItem(key, stringified);
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Quota or storage limit reached for key "${key}". Sanitizing data...`);

    // 1st Fallback: recursively replace large base64 data URLs with web URLs
    try {
      const sanitized = sanitizeValue(value);
      const sanitizedStr = JSON.stringify(sanitized);
      localStorage.setItem(key, sanitizedStr);
      return true;
    } catch (fallbackErr) {
      // 2nd Fallback: if it's an array (like orders or products), trim to latest 25 items
      try {
        if (Array.isArray(value)) {
          const sanitized = sanitizeValue(value);
          const trimmed = sanitized.slice(0, 25);
          localStorage.setItem(key, JSON.stringify(trimmed));
          return true;
        }
      } catch (trimErr) {
        // 3rd Fallback: try clearing non-vital keys if quota is strictly exhausted
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k !== key && (k.includes('cache') || k.includes('temp') || k.startsWith('said_store_hero_slides'))) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));

          // Retry with sanitized value
          const sanitized = sanitizeValue(value);
          const payload = Array.isArray(sanitized) ? sanitized.slice(0, 20) : sanitized;
          localStorage.setItem(key, JSON.stringify(payload));
          return true;
        } catch (finalErr) {
          console.warn(`[SafeStorage] Storage quota exhausted for key "${key}". In-memory state remains active.`);
        }
      }
    }
    return false;
  }
}

export function safeGetItem<T>(key: string, fallbackValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallbackValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read or parse item for key "${key}":`, err);
    return fallbackValue;
  }
}
