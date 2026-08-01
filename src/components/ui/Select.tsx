"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={inputId}
            ref={ref}
            className={cn(
              "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10",
              error && "border-rose-400",
              className
            )}
            {...props}
          >
            {options ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            )) : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
