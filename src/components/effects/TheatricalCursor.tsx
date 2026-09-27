import React, { useEffect, useRef, memo } from 'react';

interface TheatricalCursorProps {
  isLightMode?: boolean;
  enabled?: boolean;
  reduceMotion?: boolean;
}

/**
 * Precision Theatrical Lens Reticle Cursor
 * 
 * Elegant, high-precision cursor crafted for the theater experience:
 * - Crisp 4px micro-pip (0ms instantaneous true pointer tracking)
 * - Fine 20px golden lens reticle with precision sightline crosshair ticks
 * - Interactive target morphing (smoothly expands onto buttons/cards)
 * - Text mode adaptation (condenses to subtle vertical caret guide)
 * - Mechanical click snap & impulse wave (crisp tactile feedback)
 * - Completely eliminates blurry blinding glare / weird glowing blobs
 * - Zero CPU overhead (GPU-accelerated transforms via RAF)
 */
export const TheatricalCursor: React.FC<TheatricalCursorProps> = memo(({
  isLightMode = false,
  enabled = true,
  reduceMotion = false,
}) => {
  const pipRef = useRef<HTMLDivElement | null>(null);
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || reduceMotion) return;

    // Only apply on fine-pointer devices (mouse/touchpad)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const pip = pipRef.current;
    const reticle = reticleRef.current;
    const pulse = pulseRef.current;
    if (!pip || !reticle || !pulse) return;

    let mouseX = -100;
    let mouseY = -100;
    let reticleX = -100;
    let reticleY = -100;
    let isVisible = false;
    let isInteractive = false;
    let isTextTarget = false;
    let isMouseDown = false;
    let lastDomCheckTime = 0;
    let lastActiveTime = performance.now();
    let isStationary = false;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastActiveTime = performance.now();

      if (isStationary) {
        isStationary = false;
        animationFrameId = requestAnimationFrame(render);
      }

      if (!isVisible) {
        isVisible = true;
        pip.style.opacity = '1';
        reticle.style.opacity = '1';
      }

      // Throttled hover target characteristics check (max once every 50ms)
      const now = performance.now();
      if (now - lastDomCheckTime > 50) {
        lastDomCheckTime = now;
        const target = e.target as HTMLElement | null;
        if (target) {
          const textElem = target.closest('input, textarea, [contenteditable="true"]');
          isTextTarget = !!textElem;

          const clickable = target.closest(
            'a, button, [role="button"], .cursor-pointer, .glass-ambient-card, [tabindex="0"], summary, label'
          );
          isInteractive = !!clickable && !isTextTarget;
        }
      }
    };

    const onMouseDown = () => {
      isMouseDown = true;
      if (pulse) {
        pulse.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(0.6)`;
        pulse.style.opacity = isLightMode ? '0.6' : '0.8';
        pulse.style.transition = 'none';

        // Trigger pulse wave animation
        requestAnimationFrame(() => {
          pulse.style.transition = 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease-out';
          pulse.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(1.8)`;
          pulse.style.opacity = '0';
        });
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      pip.style.opacity = '0';
      reticle.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      pip.style.opacity = '1';
      reticle.style.opacity = '1';
    };

    const onBlur = () => {
      isVisible = false;
      pip.style.opacity = '0';
      reticle.style.opacity = '0';
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        pip.style.opacity = '0';
        reticle.style.opacity = '0';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    document.body.addEventListener('mouseleave', onMouseLeave);
    document.body.addEventListener('mouseenter', onMouseEnter);

    reticleX = mouseX;
    reticleY = mouseY;

    const render = () => {
      if (isVisible && !document.hidden) {
        // True-pointer center pip (0ms latency, exact pixel precision)
        pip.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

        // Smooth physical reticle follower (lerp factor 0.22)
        const lerpFactor = 0.22;
        reticleX += (mouseX - reticleX) * lerpFactor;
        reticleY += (mouseY - reticleY) * lerpFactor;

        // Dynamic morphing:
        // 1. Text target: slender vertical slit
        // 2. Interactive target: expanded lens reticle
        // 3. Normal: compact precision reticle
        let scale = 1.0;
        let width = 22;
        let height = 22;
        let borderRadius = '9999px';

        if (isTextTarget) {
          width = 3;
          height = 20;
          borderRadius = '2px';
          scale = 1.0;
        } else if (isInteractive) {
          scale = 1.6;
        }

        if (isMouseDown && !isTextTarget) {
          scale *= 0.85;
        }

        reticle.style.width = `${width}px`;
        reticle.style.height = `${height}px`;
        reticle.style.borderRadius = borderRadius;
        reticle.style.transform = `translate3d(${reticleX}px, ${reticleY}px, 0) translate(-50%, -50%) scale(${scale})`;

        // Clean, crisp colors (no blurry glowing blobs)
        if (isInteractive) {
          reticle.style.borderColor = isLightMode ? '#8c2d2d' : '#e5c38c';
          reticle.style.backgroundColor = isLightMode ? 'rgba(140, 45, 45, 0.08)' : 'rgba(229, 195, 140, 0.10)';
        } else if (isTextTarget) {
          reticle.style.borderColor = isLightMode ? '#8c2d2d' : '#e5c38c';
          reticle.style.backgroundColor = isLightMode ? '#8c2d2d' : '#e5c38c';
        } else {
          reticle.style.borderColor = isLightMode ? 'rgba(140, 45, 45, 0.45)' : 'rgba(212, 181, 137, 0.45)';
          reticle.style.backgroundColor = 'transparent';
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.body.removeEventListener('mouseleave', onMouseLeave);
      document.body.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isLightMode, enabled, reduceMotion]);

  if (!enabled || reduceMotion) {
    return null;
  }

  const accentColor = isLightMode ? '#8c2d2d' : '#d4b589';

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden hidden sm:block" aria-hidden="true">
      {/* Click Impulse Micro-Shockwave */}
      <div
        ref={pulseRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none opacity-0 border border-amber-400"
        style={{
          borderColor: accentColor,
          willChange: 'transform, opacity',
        }}
      />

      {/* Theatrical Precision Reticle with Sightline Crosshair Ticks */}
      <div
        ref={reticleRef}
        className="fixed top-0 left-0 border pointer-events-none opacity-0 transition-[border-color,background-color] duration-150 ease-out flex items-center justify-center"
        style={{
          borderColor: isLightMode ? 'rgba(140, 45, 45, 0.45)' : 'rgba(212, 181, 137, 0.45)',
          willChange: 'transform, width, height',
        }}
      >
        {/* Top Sightline Tick */}
        <span
          className="absolute -top-1 w-[1px] h-1"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
        {/* Bottom Sightline Tick */}
        <span
          className="absolute -bottom-1 w-[1px] h-1"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
        {/* Left Sightline Tick */}
        <span
          className="absolute -left-1 h-[1px] w-1"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
        {/* Right Sightline Tick */}
        <span
          className="absolute -right-1 h-[1px] w-1"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
      </div>

      {/* Instantaneous Center Micro-Pip (True Pointer Core, 4px) */}
      <div
        ref={pipRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0"
        style={{
          backgroundColor: isLightMode ? '#8c2d2d' : '#fdf6e2',
          boxShadow: isLightMode
            ? '0 0 2px rgba(140, 45, 45, 0.8)'
            : '0 0 3px rgba(212, 181, 137, 0.9)',
          willChange: 'transform',
        }}
      />
    </div>
  );
});

TheatricalCursor.displayName = 'TheatricalCursor';

