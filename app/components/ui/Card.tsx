"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "panel" | "row" | "stat" | "elevated";
export type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: ReactNode;
}

const variantClasses = {
  default: "bg-[var(--ds-surface)] border border-[var(--ds-line)] shadow-[var(--ds-shadow-none)]",
  panel: "bg-[var(--ds-surface)] border border-[var(--ds-line)] shadow-[var(--ds-shadow-soft)]",
  row: "bg-[var(--ds-surface)] border border-[var(--ds-line)] shadow-[var(--ds-shadow-none)]",
  stat: "bg-[var(--ds-surface)] border border-[var(--ds-line)] shadow-[var(--ds-shadow-none)]",
  elevated: "bg-[var(--ds-surface-raised)] border border-[var(--ds-line)] shadow-[var(--ds-shadow-raised)]",
};

const paddingClasses = {
  none: "",
  sm: "p-[var(--ds-space-3)]",
  md: "p-[var(--ds-space-4)]",
  lg: "p-[var(--ds-space-6)]",
};

const hoverClass = "transition-shadow duration-[var(--ds-motion-fast)] hover:shadow-[var(--ds-shadow-soft)]";

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      hover = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--ds-radius-lg)]",
          "transition-shadow duration-[var(--ds-motion-fast)]",
          variantClasses[variant],
          paddingClasses[padding],
          hover && hoverClass,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between border-b border-[var(--ds-line)] pb-4 mb-4", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-[var(--ds-text-h3)] font-semibold text-[var(--ds-ink)]", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-[var(--ds-text-sm)] text-[var(--ds-ink-muted)] mt-1", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center border-t border-[var(--ds-line)] pt-4 mt-auto", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card as UICard };