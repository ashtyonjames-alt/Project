import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-su-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "border rounded px-3 py-2 text-sm text-su-gray-900 bg-white w-full focus:outline-none focus:ring-2 focus:ring-su-blue focus:border-su-blue transition-colors",
          error ? "border-su-red" : "border-su-gray-200",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-su-gray-500">{hint}</p>}
      {error && <p className="text-xs text-su-red">{error}</p>}
    </div>
  );
}
