import { cn } from "@/lib/utils";

type Variant = "active" | "inactive" | "pending" | "valid" | "expired" | "proposed" | "repealed" | "amended" | "info";

const variants: Record<Variant, string> = {
  active: "bg-green-100 text-green-800",
  valid: "bg-green-100 text-green-800",
  inactive: "bg-su-gray-100 text-su-gray-700",
  expired: "bg-su-gray-100 text-su-gray-700",
  repealed: "bg-su-gray-100 text-su-gray-700",
  pending: "bg-yellow-100 text-yellow-800",
  proposed: "bg-yellow-100 text-yellow-800",
  amended: "bg-blue-100 text-blue-800",
  info: "bg-su-blue-pale text-su-blue",
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
