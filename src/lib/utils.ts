/**
 * Unified utility functions for Natural Health Morocco
 */

export const DEFAULT_FALLBACK_IMAGE = '/assets/images/hero_spices_1793739545710.jpg';

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

  // 4. GitHub URLs conversion to high-speed jsDelivr CDN
  if (trimmed.includes('github.com/') || trimmed.includes('raw.githubusercontent.com/')) {
    let rawUrl = trimmed;

    // Convert github.com to raw.githubusercontent.com
    if (rawUrl.includes('github.com/')) {
      rawUrl = rawUrl.replace('github.com/', 'raw.githubusercontent.com/');
    }

    // Clean up /blob/ or /raw/ in path
    rawUrl = rawUrl.replace('/blob/', '/').replace('/raw/', '/');

    // Fix repository asset path if /public/ was omitted for natural-health-morocco
    if (
      rawUrl.includes('natural-health-morocco/') &&
      !rawUrl.includes('/public/') &&
      rawUrl.includes('/assets/')
    ) {
      rawUrl = rawUrl.replace('/assets/', '/public/assets/');
    }

    // Convert raw.githubusercontent.com/owner/repo/branch/path to cdn.jsdelivr.net/gh/owner/repo@branch/path
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
 * Handles image errors by falling back from jsDelivr CDN to GitHub raw content,
 * and finally to DEFAULT_FALLBACK_IMAGE.
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
 * Preloads image URLs into browser memory/disk cache in background
 */
export function preloadImages(urls: (string | undefined)[]): void {
  if (!Array.isArray(urls)) return;
  
  urls.forEach((u) => {
    const formatted = formatImageUrl(u);
    if (formatted && !preloadedSet.has(formatted)) {
      preloadedSet.add(formatted);
      const img = new Image();
      img.src = formatted;
    }
  });
}
