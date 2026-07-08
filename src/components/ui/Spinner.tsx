import { cn } from "@/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("inline-block w-5 h-5 border-2 border-su-gray-200 border-t-su-blue rounded-full animate-spin", className)} />
  );
}
