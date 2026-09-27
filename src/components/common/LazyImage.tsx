import React, { useState, useEffect, useRef, memo } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  rootMargin?: string;
  fallbackSrc?: string;
}

/**
 * Optimized LazyImage component leveraging IntersectionObserver for high performance,
 * smooth skeleton transitions, immediate rendering for local data URLs, and graceful fallback.
 */
export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  containerClassName = '',
  rootMargin = '400px 0px',
  fallbackSrc,
  onError,
  ...props
}) => {
  const isDataOrBlob = src?.startsWith('data:') || src?.startsWith('blob:');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(isDataOrBlob);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
    setHasError(false);
    if (src?.startsWith('data:') || src?.startsWith('blob:')) {
      setIsInView(true);
    }
  }, [src]);

  useEffect(() => {
    if (isDataOrBlob) {
      setIsInView(true);
      return undefined;
    }

    const el = containerRef.current;
    if (!el) return undefined;

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
      return undefined;
    }
  }, [src, rootMargin, isDataOrBlob]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    setIsLoaded(true);
    setHasError(true);
    if (onError) onError(e);
  };

  const showPlaceholder = hasError || !currentSrc;

  return (
    <div ref={containerRef} className={`relative overflow-hidden w-full h-full bg-[#161618] ${containerClassName}`}>
      {/* Loading animation */}
      {!isLoaded && !showPlaceholder && (
        <div className="absolute inset-0 bg-stone-900/60 animate-pulse z-10 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 border-2 border-stone-700 border-t-[#8c2d2d] rounded-full animate-spin opacity-50" />
        </div>
      )}

      {/* Fallback display if image fails to load or src is empty */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-500 p-3 text-center z-10">
          <ImageIcon className="w-8 h-8 text-stone-600 mb-1" aria-hidden="true" />
          <span className="text-[11px] font-sans text-stone-400">相片更新中</span>
        </div>
      )}

      {isInView && currentSrc && !hasError && (
        <img
          src={currentSrc}
          alt={alt}
          loading={isDataOrBlob ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-out`}
          {...props}
        />
      )}
    </div>
  );
});


LazyImage.displayName = 'LazyImage';

