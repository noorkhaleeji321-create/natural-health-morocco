/**
 * Unified utility functions for Natural Health Morocco
 */

export const DEFAULT_FALLBACK_IMAGE = '/assets/images/hero_spices_1793739545710.jpg';

/**
 * Formats an image URL to ensure it points to the direct raw content,
 * especially for GitHub hosted images.
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

  // 3. GitHub URLs conversion
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

    return rawUrl;
  }

  return trimmed;
}

/**
 * Handles image errors by setting a fallback image.
 * Usage: <img onError={handleImageError} ... />
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== window.location.origin + DEFAULT_FALLBACK_IMAGE && !target.src.endsWith(DEFAULT_FALLBACK_IMAGE)) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
};
