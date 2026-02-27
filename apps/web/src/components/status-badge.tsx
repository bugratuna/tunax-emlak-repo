import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/types";

const statusConfig: Record<
  ListingStatus,
  { label: string; classes: string }
> = {
  DRAFT: {
    label: "Draft",
    classes: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  NEEDS_CHANGES: {
    label: "Needs Changes",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  PUBLISHED: {
    label: "Published",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  ARCHIVED: {
    label: "Archived",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const config = statusConfig[status] ?? {
    label: status,
    classes: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
      )}
    >
      {config.label}
    </span>
  );
}
