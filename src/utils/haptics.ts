/**
 * High-Performance Mobile Haptic Feedback Engine
 * - Utilizes standard Web Vibration API (navigator.vibrate) when available on touch devices.
 * - Zero CPU overhead, throttled to prevent redundant vibration storms.
 * - Supports fine-grained tactile feedback profiles (light, medium, heavy, selection, success, warning, error).
 */

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  selection: 6,
  light: 8,
  medium: 14,
  heavy: 24,
  success: [10, 30, 15],
  warning: [18, 35, 18],
  error: [25, 30, 25],
};

let lastHapticTime = 0;
const HAPTIC_THROTTLE_MS = 40;

/**
 * Trigger programmatic haptic pulse
 */
export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  const now = performance.now();
  if (now - lastHapticTime < HAPTIC_THROTTLE_MS && type === 'selection') {
    return;
  }
  lastHapticTime = now;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[type] ?? 8;
      navigator.vibrate(pattern);
    }
  } catch {
    // Non-critical: Ignore unsupported devices or silent permission restrictions
  }
}

/**
 * Global Passive Touch & Click Delegator
 * Seamlessly delivers crisp tactile feedback and micro-interaction to all
 * interactive buttons, cards, tabs, and controls without cluttering JSX components.
 */
let isGlobalHapticsInitialized = false;

export function initGlobalPassiveHaptics(): () => void {
  if (typeof window === 'undefined' || isGlobalHapticsInitialized) {
    return () => {};
  }
  isGlobalHapticsInitialized = true;

  let touchStartX = 0;
  let touchStartY = 0;
  let isPotentialTap = false;
  let activeElementTarget: HTMLElement | null = null;

  const getInteractiveTarget = (el: HTMLElement | null): HTMLElement | null => {
    if (!el) return null;
    return el.closest(
      'button, a, input, select, textarea, [role="button"], [role="tab"], .smoked-card, .interactive-card, .cursor-pointer, [data-haptic]'
    ) as HTMLElement | null;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      isPotentialTap = false;
      return;
    }
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isPotentialTap = true;

    const target = getInteractiveTarget(e.target as HTMLElement);
    activeElementTarget = target;

    if (target) {
      // Immediate subtle micro-haptic for instantaneous tactile feedback on touch
      const customHaptic = target.getAttribute('data-haptic') as HapticType;
      const isDanger = target.getAttribute('data-intent') === 'danger' || target.hasAttribute('data-danger');
      if (isDanger) {
        triggerHaptic('warning');
      } else if (customHaptic && HAPTIC_PATTERNS[customHaptic]) {
        triggerHaptic(customHaptic);
      } else {
        triggerHaptic('light');
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPotentialTap || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartX);
    const dy = Math.abs(touch.clientY - touchStartY);

    // If user moves finger > 10px, it's a scroll gesture, cancel tap state
    if (dx > 10 || dy > 10) {
      isPotentialTap = false;
      activeElementTarget = null;
    }
  };

  const handleTouchEnd = () => {
    isPotentialTap = false;
    activeElementTarget = null;
  };

  // Passive listeners guarantee 0ms touch interception & silky 60fps scrolling
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    isGlobalHapticsInitialized = false;
  };
}
