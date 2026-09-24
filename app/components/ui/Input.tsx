"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputSize = "sm" | "md" | "lg";

const sizeClasses = {
  sm: "min-h-[36px] px-3 text-sm",
  md: "min-h-[44px] px-4 text-base",
  lg: "min-h-[52px] px-5 text-lg",
};

const baseClasses =
  "w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-ink)] placeholder:text-[var(--ds-ink-muted)] outline-none transition-[border-color,box-shadow] duration-[var(--ds-motion-fast)] focus:border-[var(--ds-brand)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ds-brand)_20%,transparent)] disabled:opacity-50 disabled:cursor-not-allowed";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  fieldSize?: InputSize;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fieldSize = "md", error = false, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(baseClasses, sizeClasses[fieldSize], error && "border-[var(--ds-error)] focus:border-[var(--ds-error)]", className)}
      aria-invalid={error}
      {...props}
    />
  ),
);
Input.displayName = "Input";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  fieldSize?: InputSize;
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, fieldSize = "md", error = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(baseClasses, sizeClasses[fieldSize], "min-h-[110px] resize-y", error && "border-[var(--ds-error)] focus:border-[var(--ds-error)]", className)}
      aria-invalid={error}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  fieldSize?: InputSize;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fieldSize = "md", error = false, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseClasses, sizeClasses[fieldSize], error && "border-[var(--ds-error)] focus:border-[var(--ds-error)]", className)}
      aria-invalid={error}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-2 text-sm text-[var(--ds-ink-muted)]", className)}>
      <span>
        {label}
        {required && (
          <span className="text-[var(--ds-error)]" aria-hidden="true"> *</span>
        )}
      </span>
      {children}
      {hint && !error && <span className="text-xs">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs text-[var(--ds-error)]">
          {error}
        </span>
      )}
    </label>
  );
}

export { Input as UIInput, Textarea as UITextarea, Select as UISelect };
