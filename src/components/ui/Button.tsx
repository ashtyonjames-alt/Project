import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-su-blue text-white hover:bg-su-blue-light border border-su-blue hover:border-su-blue-light",
  secondary: "bg-su-navy text-white hover:bg-su-navy/80 border border-su-navy",
  outline: "bg-transparent text-su-blue border border-su-blue hover:bg-su-blue-pale",
  ghost: "bg-transparent text-su-gray-700 hover:bg-su-gray-100 border border-transparent",
  danger: "bg-su-red text-white hover:bg-red-700 border border-su-red",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-su-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
