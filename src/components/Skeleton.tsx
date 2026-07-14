import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-md ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-4 space-y-4">
      <Skeleton className="w-full h-48 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-1/2 h-4" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="border-b border-gray-100 dark:border-slate-700/50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
      <div className="space-y-2 w-full md:w-1/3">
        <Skeleton className="w-1/2 h-5" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      <div className="space-y-1 w-full md:w-1/4">
        <Skeleton className="w-2/3 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
      <Skeleton className="w-24 h-8 rounded-full" />
      <Skeleton className="w-28 h-5" />
    </div>
  );
}
