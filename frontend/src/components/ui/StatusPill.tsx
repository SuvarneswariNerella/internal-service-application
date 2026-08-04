import { cn } from "@/utils/cn";

type StatusVariant = "active" | "inactive" | "pending" | "expired" | "archived" | "warning" | "success";

interface StatusPillProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { variant: StatusVariant; label: string }> = {
  ACTIVE: { variant: "active", label: "Active" },
  INACTIVE: { variant: "inactive", label: "Inactive" },
  PENDING: { variant: "pending", label: "Pending" },
  PAID: { variant: "active", label: "Paid" },
  OVERDUE: { variant: "expired", label: "Overdue" },
  CANCELLED: { variant: "inactive", label: "Cancelled" },
  EXPIRED: { variant: "expired", label: "Expired" },
  EXPIRING_SOON: { variant: "pending", label: "Expiring Soon" },
  DECOMMISSIONED: { variant: "archived", label: "Decommissioned" },
  ARCHIVED: { variant: "archived", label: "Archived" },
  PLANNING: { variant: "pending", label: "Planning" },
  IN_PROGRESS: { variant: "active", label: "In Progress" },
  ON_HOLD: { variant: "warning", label: "On Hold" },
  COMPLETED: { variant: "success", label: "Completed" },
};

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  archived: "bg-purple-100 text-purple-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-green-100 text-green-700",
};

export default function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] ?? { variant: "inactive" as StatusVariant, label: status };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[config.variant],
        className,
      )}
    >
      {config.label}
    </span>
  );
}
