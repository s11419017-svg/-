/**
 * High-Performance Event Rate-Limiting Utilities (2026 Production Standard)
 * Provides microsecond-optimized Throttle, Debounce, and RequestAnimationFrame Throttle
 * for scroll, resize, input, and touch events without layout thrashing.
 */

export interface CancelableFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush?: () => void;
}

/**
 * Creates a throttled function that only invokes the provided function at most once
 * per every `wait` milliseconds. Includes leading and trailing invocation support.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): CancelableFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T> | undefined;
  let lastCallTime = 0;

  const leading = options.leading !== false;
  const trailing = options.trailing !== false;

  const invokeFunc = (time: number) => {
    lastCallTime = time;
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    return result;
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
    lastThis = null;
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const isFirstCall = !lastCallTime;

    if (isFirstCall && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invokeFunc(now);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing && lastArgs) {
          invokeFunc(Date.now());
        }
      }, remaining);
    }
  } as CancelableFunction<T>;

  throttled.cancel = cancel;
  return throttled;
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): CancelableFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    const callNow = immediate && !timeoutId;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate && lastArgs) {
        func.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, wait);

    if (callNow) {
      func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  } as CancelableFunction<T>;

  debounced.cancel = cancel;
  return debounced;
}

/**
 * Batches high-frequency events (like scroll or resize) directly to the browser's
 * animation frame pipeline using requestAnimationFrame.
 * Eliminates redundant state updates and layout recalculations between display refreshes.
 */
export function rafThrottle<T extends (...args: any[]) => any>(func: T): CancelableFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const cancel = () => {
    if (rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (rafId === null && typeof window !== 'undefined') {
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      });
    }
  } as CancelableFunction<T>;

  throttled.cancel = cancel;
  return throttled;
}
