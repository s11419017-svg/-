// Micro-utility for 60fps/120fps hardware-synchronized interaction without triggering Layout/Reflow

/**
 * Creates a requestAnimationFrame-throttled function that guarantees updates
 * align perfectly with the browser's display refresh rate (V-Sync).
 */
export function rafThrottle<T extends (...args: any[]) => void>(fn: T): (...args: Parameters<T>) => void {
  let isTicking = false;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(() => {
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
        isTicking = false;
      });
    }
  };
}

/**
 * Safely executes a task when the main thread is idle, or falls back to setTimeout.
 */
export function runWhenIdle(callback: () => void, timeout = 2000): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 100);
  }
}
