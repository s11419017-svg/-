import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  rootMargin?: string;
}

/**
 * Optimized LazyImage component leveraging IntersectionObserver for high performance,
 * smooth skeleton transitions, and referrer privacy.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  rootMargin = '200px 0px',
  onError,
  ...props
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin }
      );

      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    } else {
      setIsInView(true);
    }
  }, [src, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setHasError(true);
    if (onError) onError(e);
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full ${containerClassName}`}>
      {/* Skeleton loading animation until image is loaded */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-stone-900/80 animate-pulse z-10 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-stone-700 border-t-[#8c2d2d] rounded-full animate-spin opacity-60" />
        </div>
      )}

      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          {...props}
        />
      )}
    </div>
  );
};
