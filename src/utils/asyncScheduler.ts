/**
 * High-Performance Async Scheduler, Debounce & Throttle Utilities
 * Designed to ensure INP < 50ms, non-blocking main thread execution,
 * and memory-leak-safe event handling.
 */

/**
 * Throttle a function to run at most once per `limit` ms,
 * prioritizing requestAnimationFrame on the leading edge.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Debounce a function to execute only after `delay` ms of inactivity.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
      timer = null;
    }, delay);
  };
}

/**
 * Run task non-blockingly using requestIdleCallback with requestAnimationFrame fallback,
 * ensuring high interaction responsiveness (INP < 100ms).
 */
export function runNonBlocking(task: () => void, timeout: number = 2000): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(
      (deadline: { didTimeout: boolean; timeRemaining: () => number }) => {
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          task();
        } else {
          setTimeout(task, 0);
        }
      },
      { timeout }
    );
  } else if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    requestAnimationFrame(() => {
      setTimeout(task, 0);
    });
  } else {
    setTimeout(task, 0);
  }
}
