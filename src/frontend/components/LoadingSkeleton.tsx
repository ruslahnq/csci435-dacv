import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 w-3/4 rounded bg-muted" />
    </div>
  );
}

export function CredentialCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export function VerificationResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
