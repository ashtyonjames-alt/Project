import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export default function Select({ label, options, error, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-su-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "border rounded px-3 py-2 text-sm text-su-gray-900 bg-white w-full focus:outline-none focus:ring-2 focus:ring-su-blue focus:border-su-blue transition-colors",
          error ? "border-su-red" : "border-su-gray-200",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-su-red">{error}</p>}
    </div>
  );
}
