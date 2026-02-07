type LoadingSkeletonProps = {
  lines?: number;
};

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-800"
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
