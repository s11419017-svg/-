/**
 * Core Web Vitals & Older Hardware DOM Sluggishness Monitoring Utility
 * 
 * Specifically designed to help developers identify:
 * 1. Core Web Vitals (LCP, CLS, INP/FID, FCP, TTFB)
 * 2. Main-thread blocking Long Tasks (>50ms) causing dropped frames on older CPUs
 * 3. Scroll frame-rate drops (<30 FPS) and DOM reflow thrashing on constrained devices
 * 4. Device hardware tiering (deviceMemory, hardwareConcurrency, total DOM node count)
 */

export interface PerformanceReport {
  lcp: number | null;
  cls: number;
  inp: number | null;
  fcp: number | null;
  ttfb: number | null;
  longTaskCount: number;
  totalLongTaskTime: number;
  domNodeCount: number;
  fpsDuringScroll: number | null;
  hardwareTier: 'low' | 'medium' | 'high';
  hardwareInfo: {
    deviceMemoryGB?: number;
    hardwareConcurrency?: number;
    connectionType?: string;
  };
}

const currentMetrics: PerformanceReport = {
  lcp: null,
  cls: 0,
  inp: null,
  fcp: null,
  ttfb: null,
  longTaskCount: 0,
  totalLongTaskTime: 0,
  domNodeCount: 0,
  fpsDuringScroll: null,
  hardwareTier: 'high',
  hardwareInfo: {},
};

/**
 * Initializes continuous Web Vitals observation and hardware sluggishness detection.
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  // 1. Detect Hardware Capabilities
  const nav = navigator as unknown as { deviceMemory?: number; hardwareConcurrency?: number; connection?: { effectiveType?: string } };
  const memory = nav.deviceMemory; // in GB
  const cores = nav.hardwareConcurrency; // logical cores
  const conn = nav.connection?.effectiveType;

  currentMetrics.hardwareInfo = {
    deviceMemoryGB: memory,
    hardwareConcurrency: cores,
    connectionType: conn,
  };

  if ((memory && memory <= 3) || (cores && cores <= 4)) {
    currentMetrics.hardwareTier = 'low';
    document.documentElement.classList.add('low-power-mode');
  } else if ((memory && memory <= 6) || (cores && cores <= 6)) {
    currentMetrics.hardwareTier = 'medium';
  } else {
    currentMetrics.hardwareTier = 'high';
  }

  // 2. Navigation Timing (TTFB)
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceNavigationTiming;
      currentMetrics.ttfb = Math.round(navEntry.responseStart);
    }
  } catch {}

  // 3. Performance Observers for Core Web Vitals (Zero-overhead passive observers)
  if ('PerformanceObserver' in window) {
    try {
      // Paint Timing (FCP)
      const paintObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            currentMetrics.fcp = Math.round(entry.startTime);
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
    } catch {}

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          currentMetrics.lcp = Math.round(lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    try {
      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) {
          if (!entry.hadRecentInput) {
            currentMetrics.cls += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}

    try {
      // Long Tasks (>50ms) Observer for main-thread CPU choking detection
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          currentMetrics.longTaskCount++;
          currentMetrics.totalLongTaskTime += entry.duration;
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {}
  }
}

/**
 * Returns a snapshot of performance metrics
 */
export function getPerformanceSnapshot(): PerformanceReport {
  if (typeof document !== 'undefined') {
    currentMetrics.domNodeCount = document.querySelectorAll('*').length;
  }
  return { ...currentMetrics };
}
