import React, { useRef, useCallback } from 'react';
import { motion, useSpring } from 'motion/react';

interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // Distance pull multiplier (default: 0.28)
  disabled?: boolean;
}

/**
 * High-performance Magnetic & Elastic Hover component using React Motion springs.
 * Pulls the element towards cursor smoothly and releases with a damped spring bounce.
 */
export const MagneticWrapper: React.FC<MagneticWrapperProps> = ({
  children,
  className = '',
  strength = 0.28,
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // High-performance Spring physics configuration (Apple/Linear style damped bounce)
  const springConfig = { damping: 18, stiffness: 220, mass: 0.6 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = (e.clientX - centerX) * strength;
      const distanceY = (e.clientY - centerY) * strength;

      x.set(distanceX);
      y.set(distanceY);
    },
    [disabled, strength, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block transform-gpu will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
};
