import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export default function SectionWrapper({ children, className, narrow }: SectionWrapperProps) {
  return (
    <section className={cn("py-10 px-4", className)}>
      <div className={cn("mx-auto", narrow ? "max-w-3xl" : "max-w-7xl")}>
        {children}
      </div>
    </section>
  );
}
