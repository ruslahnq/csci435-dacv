import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-success" : "bg-destructive"
        )}
      />
      {isActive ? "Active" : "Revoked"}
    </span>
  );
}
