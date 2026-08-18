import React from 'react';
import { Users, BookOpen, Camera, Sparkles } from 'lucide-react';

export const CastSectionSkeleton: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#1a1a1c] border-t border-stone-800/60 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase">
            <Users className="w-3.5 h-3.5 animate-pulse" />
            <span className="h-3 w-32 bg-stone-800/80 rounded animate-pulse inline-block" />
          </div>
          <div className="h-9 w-64 sm:w-80 bg-stone-800/80 rounded-md animate-pulse mx-auto" />
          <div className="h-4 w-full max-w-md bg-stone-800/60 rounded animate-pulse mx-auto" />
        </div>

        {/* Filter Controls Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 bg-stone-800/70 rounded-sm animate-pulse" />
            ))}
          </div>
          <div className="h-8 w-36 bg-stone-800/70 rounded-sm animate-pulse" />
        </div>

        {/* Member Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className="bg-[#161618] border border-stone-800 rounded-sm p-4 space-y-4 shadow-lg"
            >
              {/* Avatar Photo Skeleton */}
              <div className="relative aspect-square w-full bg-stone-800/80 rounded-sm overflow-hidden animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-stone-700/50 border-t-[#8c2d2d] rounded-full animate-spin opacity-40" />
                </div>
              </div>

              {/* Character Details Skeleton */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 bg-stone-800/90 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-stone-800/70 rounded-full animate-pulse" />
                </div>
                <div className="h-3 w-36 bg-stone-800/60 rounded animate-pulse" />
                <div className="h-3 w-full bg-stone-800/40 rounded animate-pulse pt-1" />
              </div>

              {/* Action Button Skeleton */}
              <div className="pt-2 border-t border-stone-800/80 flex justify-between items-center">
                <div className="h-3 w-20 bg-stone-800/60 rounded animate-pulse" />
                <div className="h-6 w-16 bg-stone-800/70 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const RehearsalSectionSkeleton: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-stone-800/60 bg-[#161618] animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.2em] text-[#8c2d2d] uppercase">
            <BookOpen className="w-3.5 h-3.5 animate-pulse" />
            <span className="h-3 w-36 bg-stone-800/80 rounded animate-pulse inline-block" />
          </div>
          <div className="h-9 w-64 sm:w-80 bg-stone-800/80 rounded-md animate-pulse mx-auto" />
          <div className="h-4 w-full max-w-lg bg-stone-800/60 rounded animate-pulse mx-auto" />
          <div className="w-12 h-[1px] bg-[#8c2d2d] mx-auto mt-4" />
        </div>

        {/* Content Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Manuscript Skeleton (5 cols) */}
          <div className="lg:col-span-5 bg-[#1a1a1c] p-8 border border-stone-800 rounded-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-4 w-40 bg-stone-800/80 rounded animate-pulse" />
              <div className="h-6 w-3/4 bg-stone-800/90 rounded animate-pulse" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-full bg-stone-800/60 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-stone-800/60 rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-stone-800/60 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-24 bg-stone-800/40 rounded border border-stone-800/80 animate-pulse p-4 space-y-2">
              <div className="h-3 w-32 bg-stone-800/80 rounded" />
              <div className="h-3 w-full bg-stone-800/50 rounded" />
            </div>
          </div>

          {/* Right Photos Skeleton Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="bg-[#1a1a1c] border border-stone-800 rounded-sm overflow-hidden p-3 space-y-3"
              >
                <div className="aspect-video w-full bg-stone-800/80 rounded-sm relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-stone-700 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-stone-800/80 rounded animate-pulse" />
                  <div className="h-3 w-full bg-stone-800/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
