import { useEffect } from 'react';
import { initGlobalPassiveHaptics } from '../utils/haptics';

/**
 * 100% Non-blocking, Passive Tactile Physics & Momentum Hook.
 * - Zero event interception / ZERO preventDefault().
 * - Uses strictly passive event listeners ({ passive: true }).
 * - Native browser scrolling remains 100% unhindered, fluid, and instant.
 * - Initializes seamless mobile haptic feedback for all interactive elements and gestures.
 */
export function usePassiveScrollPhysics() {
  useEffect(() => {
    // 1. Initialize passive haptic feedback on touch devices
    const cleanupHaptics = initGlobalPassiveHaptics();

    // 2. Performance: Mark document element for optimized compositing during touch interactions
    if (typeof document !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'auto';
    }

    return () => {
      cleanupHaptics();
    };
  }, []);
}


