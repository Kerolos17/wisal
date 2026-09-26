// Skeleton primitive: quiet loading placeholder for ops screens.
// Pure CSS shimmer (flattened under prefers-reduced-motion by the global closer).
type SkeletonProps = {
  className?: string;
  /** Height in px; defaults to one text line. */
  height?: number;
  rounded?: boolean;
};

export function Skeleton({ className = "", height = 16, rounded = false }: SkeletonProps) {
  return (
    <span
      className={`ui-skeleton ${className}`}
      style={{ height, borderRadius: rounded ? "999px" : undefined }}
      aria-hidden="true"
    />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="ui-skeleton-block" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} height={14} className={index === lines - 1 ? "ui-skeleton-short" : ""} />
      ))}
    </div>
  );
}
