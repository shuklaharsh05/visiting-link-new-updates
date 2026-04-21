/**
 * Returns true when the viewport is mobile-width (< 1024px, matching the lg: breakpoint).
 * This is a one-shot check – ideal for redirect decisions at login time.
 */
export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}
