/**
 * Unified utility functions for Natural Health Morocco
 */

export const DEFAULT_FALLBACK_IMAGE = '/assets/images/hero_spices_1793739545710.webp';

/**
 * Formats an image URL to ensure it points to direct content,
 * converting GitHub raw content URLs into edge-accelerated jsDelivr CDN URLs.
 */
export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Data URLs and Blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Local relative paths (e.g. /assets/images/... or assets/images/...)
  if (trimmed.startsWith('/') || trimmed.startsWith('assets/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // 3. Already a jsDelivr CDN or wsrv optimized URL
  if (trimmed.includes('cdn.jsdelivr.net/gh/') || trimmed.includes('wsrv.nl/')) {
    return trimmed;
  }

  // 4. Convert GitHub raw/repo URLs directly to edge-accelerated jsDelivr CDN (0ms latency, zero proxy overhead)
  if (trimmed.includes('github.com/') || trimmed.includes('raw.githubusercontent.com/')) {
    let rawUrl = trimmed;

    if (rawUrl.includes('github.com/')) {
      rawUrl = rawUrl.replace('github.com/', 'raw.githubusercontent.com/');
    }

    rawUrl = rawUrl.replace('/blob/', '/').replace('/raw/', '/');

    if (
      rawUrl.includes('natural-health-morocco/') &&
      !rawUrl.includes('/public/') &&
      rawUrl.includes('/assets/')
    ) {
      rawUrl = rawUrl.replace('/assets/', '/public/assets/');
    }

    const match = rawUrl.match(/https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
    if (match) {
      const [, owner, repo, branch, filePath] = match;
      return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${filePath}`;
    }

    return rawUrl;
  }

  return trimmed;
}

/**
 * Generates an edge-resized, compressed WebP thumbnail URL via wsrv.nl CDN
 * for card grids & carousels (reduces 1024x1024 category/product files from ~150KB down to ~15KB).
 * Falls back cleanly to direct jsDelivr/raw URL if onError triggers.
 */
export function formatThumbUrl(url?: string, width: number = 400, quality: number = 72): string {
  const formatted = formatImageUrl(url);
  if (!formatted) return '';

  if (
    formatted.startsWith('/') ||
    formatted.startsWith('data:') ||
    formatted.startsWith('blob:') ||
    formatted.includes('wsrv.nl/')
  ) {
    return formatted;
  }

  if (formatted.startsWith('http://') || formatted.startsWith('https://')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(formatted)}&w=${width}&q=${quality}&output=webp&we`;
  }

  return formatted;
}

/**
 * Handles image errors by falling back:
 * wsrv.nl -> direct jsDelivr/origin URL -> raw.githubusercontent.com -> DEFAULT_FALLBACK_IMAGE.
 * Usage: <img onError={handleImageError} ... />
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  const currentSrc = target.src || '';

  // 1. If optimized wsrv.nl thumbnail failed, unwrap and fallback directly to source CDN URL
  if (currentSrc.includes('wsrv.nl/')) {
    try {
      const parsed = new URL(currentSrc);
      const original = parsed.searchParams.get('url');
      if (original && original !== currentSrc) {
        target.src = original;
        return;
      }
    } catch {}
  }

  // 2. If jsDelivr failed, fallback to raw.githubusercontent.com
  if (currentSrc.includes('cdn.jsdelivr.net/gh/')) {
    const match = currentSrc.match(/https?:\/\/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@]+)@([^\/]+)\/(.+)/);
    if (match) {
      const [, owner, repo, branch, filePath] = match;
      target.src = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      return;
    }
  }

  // 3. Fallback to DEFAULT_FALLBACK_IMAGE if not already set
  if (!currentSrc.includes(DEFAULT_FALLBACK_IMAGE)) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
};

const preloadedSet = new Set<string>();

/**
 * Preloads image URLs into browser memory/disk cache and decodes off the main thread
 */
export function preloadImages(urls: (string | undefined)[]): void {
  if (!Array.isArray(urls) || typeof Image === 'undefined') return;

  urls.forEach((u) => {
    const formatted = formatImageUrl(u);
    if (formatted && !preloadedSet.has(formatted)) {
      preloadedSet.add(formatted);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
      };
      img.onerror = () => {
        preloadedSet.delete(formatted);
      };
      img.src = formatted;
    }
  });
}

/**
 * Warms image cache in small parallel batches after critical LCP settles,
 * preventing lazy pop-in on scroll without saturating initial network bandwidth.
 */
export function preloadImagesBatched(
  urls: (string | undefined)[],
  batchSize: number = 8,
  intervalMs: number = 100,
  initialDelayMs: number = 200
): () => void {
  if (!Array.isArray(urls) || typeof window === 'undefined') {
    return () => {};
  }

  const queue = Array.from(
    new Set(urls.map((u) => formatImageUrl(u)).filter((u) => Boolean(u) && !preloadedSet.has(u)))
  );

  if (queue.length === 0) return () => {};

  let cancelled = false;
  let timerId: number | undefined;
  let offset = 0;

  const processNextBatch = () => {
    if (cancelled || offset >= queue.length) return;
    const batch = queue.slice(offset, offset + batchSize);
    offset += batchSize;
    preloadImages(batch);
    if (offset < queue.length) {
      timerId = window.setTimeout(processNextBatch, intervalMs);
    }
  };

  timerId = window.setTimeout(processNextBatch, initialDelayMs);

  return () => {
    cancelled = true;
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  };
}

/**
 * Sorts catalog products according to admin-configured display order (sortOrder ascending),
 * falling back to newest createdAt first so older products never bury newer items.
 */
export function sortProductsByDisplayOrder<
  T extends { sortOrder?: number; createdAt?: string; id?: string }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aHas = typeof a.sortOrder === 'number' && Number.isFinite(a.sortOrder);
    const bHas = typeof b.sortOrder === 'number' && Number.isFinite(b.sortOrder);
    if (aHas && bHas) {
      if (a.sortOrder! !== b.sortOrder!) {
        return a.sortOrder! - b.sortOrder!;
      }
    } else if (aHas && !bHas) {
      return -1;
    } else if (!aHas && bHas) {
      return 1;
    }

    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }

    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

