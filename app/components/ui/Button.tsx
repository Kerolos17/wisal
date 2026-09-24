"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "danger" | "text";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "min-h-[36px] px-3 text-sm gap-1.5",
  md: "min-h-[44px] px-5 text-base gap-2",
  lg: "min-h-[52px] px-6 text-lg gap-2.5",
};

const variantClasses = {
  primary: "bg-[var(--ds-action)] text-[var(--ds-action-ink)] border-0 shadow-[var(--ds-shadow-raised)] hover:bg-[var(--ds-action-hover)] active:scale-[0.98]",
  ghost: "bg-transparent border border-[var(--ds-line)] text-[var(--ds-brand)] hover:bg-[var(--ds-line)] active:bg-[var(--ds-line-soft)]",
  danger: "bg-[var(--ds-error)] text-white border-0 shadow-[var(--ds-shadow-raised)] hover:opacity-90 active:scale-[0.98]",
  text: "bg-transparent border-0 text-[var(--ds-brand)] font-semibold hover:underline active:opacity-70",
};

const fullWidthClass = "w-full justify-center";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold",
          "transition-[background-color,border-color,color,transform,box-shadow]",
          "duration-[var(--ds-motion-fast)] ease-[var(--ds-ease-out)]",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--ds-brand)] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-h-[44px]",
          "rounded-[var(--ds-radius-md)]",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && fullWidthClass,
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center" aria-hidden="true">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        ) : icon && iconPosition === "left" ? (
          <span className="flex items-center" aria-hidden="true">{icon}</span>
        ) : null}
        <span className={cn("flex items-center", loading && "opacity-0")}>
          {children}
        </span>
        {icon && iconPosition === "right" && !loading && (
          <span className="flex items-center" aria-hidden="true">{icon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button as UIButton };