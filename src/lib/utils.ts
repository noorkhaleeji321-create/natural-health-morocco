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

  // 3. Already a jsDelivr CDN URL
  if (trimmed.includes('cdn.jsdelivr.net/gh/')) {
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
 * Handles image errors by falling back from local category assets to jsDelivr CDN,
 * then to GitHub raw content, and finally to DEFAULT_FALLBACK_IMAGE.
 * Usage: <img onError={handleImageError} ... />
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  const currentSrc = target.src || '';

  // If jsDelivr failed, fallback to raw.githubusercontent.com
  if (currentSrc.includes('cdn.jsdelivr.net/gh/')) {
    const match = currentSrc.match(/https?:\/\/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@]+)@([^\/]+)\/(.+)/);
    if (match) {
      const [, owner, repo, branch, filePath] = match;
      target.src = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      return;
    }
  }

  // Fallback to DEFAULT_FALLBACK_IMAGE if not already set
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
