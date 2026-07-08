import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function Card({ title, description, icon, href, footer, children, className }: CardProps) {
  const inner = (
    <div className={cn("bg-white border border-su-gray-100 rounded-lg p-5 shadow-card flex flex-col gap-2 h-full", href && "hover:shadow-card-hover transition-shadow duration-200", className)}>
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      {title && <h3 className="font-semibold text-su-gray-900 text-base">{title}</h3>}
      {description && <p className="text-su-gray-500 text-sm leading-relaxed">{description}</p>}
      {children}
      {footer && <div className="mt-auto pt-3 border-t border-su-gray-100">{footer}</div>}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{inner}</Link>;
  }
  return inner;
}
