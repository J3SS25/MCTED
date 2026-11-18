import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

interface ToolImageGalleryProps {
  images: string[];
  alt: string;
  compact?: boolean;
}

export function ToolImageGallery({
  images,
  alt,
  compact = false,
}: ToolImageGalleryProps) {
  const safeImages = images.length > 0 ? images : ['/equipment/fallback.svg'];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= safeImages.length) {
      setActiveIndex(0);
    }
  }, [safeImages.length, activeIndex]);

  const currentSrc = safeImages[activeIndex] || '/equipment/fallback.svg';
  const hasMultiple = safeImages.length > 1;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Carousel Stage */}
      <div
        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden ${
          compact ? 'min-h-[220px]' : 'min-h-[320px]'
        }`}
      >
        <img
          src={currentSrc}
          alt={`${alt} - Image ${activeIndex + 1}`}
          className={`${compact ? 'max-h-[190px]' : 'max-h-[280px]'} max-w-full object-contain rounded-lg transition-all`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
          }}
        />

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/75 text-white backdrop-blur-sm">
          <Images className="h-3 w-3" />
          {activeIndex + 1} / {safeImages.length}
        </span>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Gallery Strip */}
      {hasMultiple && (
        <div className="grid grid-cols-5 gap-2" role="list" aria-label="Tool image thumbnails">
          {safeImages.map((src, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${idx}-${src.slice(0, 32)}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-current={isSelected ? 'true' : undefined}
                className={`h-14 rounded-lg border p-1 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden transition-all ${
                  isSelected
                    ? 'border-civic-forest ring-2 ring-civic-accent/40'
                    : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={src}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
