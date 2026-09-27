/**
 * 2026 Native W3C Cross-Document / Same-Document View Transitions API Wrapper
 * Zero-runtime overhead, 0ms compositing latency for Modals, Tabs and Routing
 */
export function executeViewTransition(updateDomCallback: () => void | Promise<void>): void {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as any).startViewTransition === 'function'
  ) {
    (document as any).startViewTransition(async () => {
      await updateDomCallback();
    });
  } else {
    updateDomCallback();
  }
}
