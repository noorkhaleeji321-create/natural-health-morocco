import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-[#121A16] rounded-xl sm:rounded-2xl border border-[#223128] overflow-hidden flex flex-col justify-between animate-pulse"
        >
          {/* Skeleton Image Area */}
          <div className="relative aspect-square w-full bg-[#18231D] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#202E26]/80" />
            <div className="absolute top-2 right-2 w-16 h-4 bg-[#23332A] rounded-full" />
          </div>

          {/* Skeleton Body Area */}
          <div className="p-2 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-12 h-3 bg-[#1D2B22] rounded-md" />
                <div className="w-10 h-3 bg-[#1D2B22] rounded-md" />
              </div>
              <div className="w-3/4 h-4 bg-[#23332A] rounded-md" />
              <div className="w-1/2 h-3 bg-[#1D2B22] rounded-md" />
            </div>

            {/* Skeleton Price and Action Button */}
            <div className="pt-2 border-t border-[#1C2822] flex items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="w-14 h-4 bg-[#25382E] rounded-md" />
                <div className="w-10 h-2.5 bg-[#1B2920] rounded-md" />
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#23332A]" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
