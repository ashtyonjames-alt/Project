import { cn } from "@/lib/utils";

type AlertType = "info" | "success" | "warning" | "error";

const styles: Record<AlertType, string> = {
  info: "bg-su-blue-pale border-su-blue text-su-blue",
  success: "bg-green-50 border-su-green text-green-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  error: "bg-red-50 border-su-red text-red-800",
};

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Alert({ type = "info", title, children, className }: AlertProps) {
  return (
    <div className={cn("border-l-4 p-4 rounded-r", styles[type], className)}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
